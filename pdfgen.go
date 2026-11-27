package main

import (
	"bytes"
	"encoding/base64"
	"errors"
	"fmt"
	"image"
	_ "image/gif"
	"image/jpeg"
	_ "image/png"
	"math"
)

// A4 尺寸（点，1pt = 1/72 英寸）
const (
	a4W = 595.276
	a4H = 841.890
)

type pdfPage struct {
	jpeg  []byte
	pxW   int
	pxH   int
	drawH float64
}

// imagePDF 把整页截图（PNG/JPEG）按 A4 比例切成多页，生成图片型 PDF。
// 这是没有可用 Chromium 内核时的兜底方案，保证「导出 PDF」一定可用。
func imagePDF(b64 string) ([]byte, error) {
	raw, err := base64.StdEncoding.DecodeString(b64)
	if err != nil {
		return nil, errors.New("图片数据解码失败")
	}
	img, _, err := image.Decode(bytes.NewReader(raw))
	if err != nil {
		return nil, errors.New("图片格式不支持：" + err.Error())
	}

	b := img.Bounds()
	w, h := b.Dx(), b.Dy()
	if w <= 0 || h <= 0 {
		return nil, errors.New("图片尺寸异常")
	}

	sliceH := int(math.Round(float64(w) * a4H / a4W)) // 一页可容纳的像素高度
	if sliceH < 1 {
		return nil, errors.New("页面尺寸异常")
	}
	pages := (h + sliceH - 1) / sliceH
	if pages < 1 {
		pages = 1
	}
	if pages > 60 {
		return nil, errors.New("内容过长，无法生成 PDF")
	}

	out := make([]pdfPage, 0, pages)
	for i := 0; i < pages; i++ {
		y0 := i * sliceH
		y1 := y0 + sliceH
		if y1 > h {
			y1 = h
		}
		sub := cropImage(img, image.Rect(0, y0, w, y1))
		var buf bytes.Buffer
		if err := jpeg.Encode(&buf, sub, &jpeg.Options{Quality: 92}); err != nil {
			return nil, errors.New("图片编码失败：" + err.Error())
		}
		drawH := a4W * float64(y1-y0) / float64(w)
		out = append(out, pdfPage{jpeg: buf.Bytes(), pxW: w, pxH: y1 - y0, drawH: drawH})
	}
	return assemblePDF(out)
}

func cropImage(src image.Image, r image.Rectangle) image.Image {
	type subImager interface {
		SubImage(image.Rectangle) image.Image
	}
	if si, ok := src.(subImager); ok {
		return si.SubImage(r)
	}
	dst := image.NewRGBA(image.Rect(0, 0, r.Dx(), r.Dy()))
	for y := 0; y < r.Dy(); y++ {
		for x := 0; x < r.Dx(); x++ {
			dst.Set(x, y, src.At(r.Min.X+x, r.Min.Y+y))
		}
	}
	return dst
}

// assemblePDF 手工拼装 PDF 1.4 结构：目录 / 页树 / 每页 page + content + DCTDecode 图片。
func assemblePDF(pages []pdfPage) ([]byte, error) {
	if len(pages) == 0 {
		return nil, errors.New("没有可输出的页面")
	}
	var buf bytes.Buffer
	var offsets []int // offsets[objNum] = 文件偏移

	write := func(s string) { buf.WriteString(s) }
	beginObj := func(num int) {
		for len(offsets) <= num {
			offsets = append(offsets, 0)
		}
		offsets[num] = buf.Len()
		fmt.Fprintf(&buf, "%d 0 obj\n", num)
	}

	write("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")

	catalog := 1
	pagesObj := 2
	first := 3

	beginObj(catalog)
	write("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")

	ids := make([]int, len(pages))
	for i := range pages {
		ids[i] = first + i*3
	}
	beginObj(pagesObj)
	write("<< /Type /Pages /Count ")
	fmt.Fprintf(&buf, "%d", len(pages))
	write(" /Kids [")
	for _, id := range ids {
		fmt.Fprintf(&buf, " %d 0 R", id)
	}
	write(" ] >>\nendobj\n")

	for i, p := range pages {
		pageNum := ids[i]
		imgNum := first + i*3 + 1
		contNum := first + i*3 + 2

		beginObj(pageNum)
		fmt.Fprintf(&buf, "<< /Type /Page /Parent %d 0 R /MediaBox [0 0 %.3f %.3f] ", pagesObj, a4W, a4H)
		fmt.Fprintf(&buf, "/Resources << /XObject << /Im0 %d 0 R >> >> /Contents %d 0 R >>\nendobj\n", imgNum, contNum)

		beginObj(imgNum)
		fmt.Fprintf(&buf, "<< /Type /XObject /Subtype /Image /Width %d /Height %d /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length %d >>\nstream\n",
			p.pxW, p.pxH, len(p.jpeg))
		buf.Write(p.jpeg)
		write("\nendstream\nendobj\n")

		content := fmt.Sprintf("q %.3f 0 0 %.3f 0 %.3f cm /Im0 Do Q", a4W, p.drawH, a4H-p.drawH)
		beginObj(contNum)
		fmt.Fprintf(&buf, "<< /Length %d >>\nstream\n", len(content))
		write(content)
		write("\nendstream\nendobj\n")
	}

	xrefPos := buf.Len()
	fmt.Fprintf(&buf, "xref\n0 %d\n", len(offsets))
	write("0000000000 65535 f \n")
	for i := 1; i < len(offsets); i++ {
		fmt.Fprintf(&buf, "%010d 00000 n \n", offsets[i])
	}
	fmt.Fprintf(&buf, "trailer\n<< /Size %d /Root %d 0 R >>\nstartxref\n%d\n%%%%EOF\n", len(offsets), catalog, xrefPos)

	return buf.Bytes(), nil
}
