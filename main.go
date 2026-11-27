// 简历工坊 · ResumeMaker
//
// 单文件本地服务：双击 exe 启动 127.0.0.1 上的 HTTP 服务并自动打开浏览器。
// 所有前端资源通过 go:embed 打进 exe，数据保存在本机，不联网。
package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"embed"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
	"sync"
	"syscall"
	"time"
)

const version = "1.0.0"

//go:embed web
var embeddedWeb embed.FS

var (
	token    string
	baseURL  string
	httpPort int

	mu       sync.Mutex
	resumeJS json.RawMessage // 当前简历 JSON（原样保存）
)

func main() {
	log.SetFlags(log.Ltime)
	log.SetPrefix("[简历工坊] ")
	initConsole()

	port := flag.Int("port", 0, "监听端口，0 表示随机")
	noBrowser := flag.Bool("no-browser", false, "不自动打开浏览器")
	dataDir := flag.String("data", "", "数据目录（默认 %APPDATA%\\ResumeMaker）")
	flag.Parse()

	if *dataDir != "" {
		storeDir = *dataDir
	} else {
		storeDir = defaultStoreDir()
	}
	if err := os.MkdirAll(storeDir, 0o755); err != nil {
		log.Printf("⚠ 无法创建数据目录 %s：%v", storeDir, err)
	}
	instancePath = filepath.Join(storeDir, "instance.json")

	// 已经有一个实例在跑：直接把浏览器切过去，避免两个实例互相覆盖存档。
	if *port == 0 {
		if url, ok := runningInstance(); ok {
			fmt.Println()
			fmt.Println("  简历工坊已经在运行，正在切换到已打开的窗口。")
			fmt.Println("  地址：" + url)
			fmt.Println()
			if !*noBrowser {
				openBrowser(url)
			}
			time.Sleep(700 * time.Millisecond)
			return
		}
	}

	token = randomToken()
	loadResume()

	mux := buildRouter()

	ln, err := net.Listen("tcp", fmt.Sprintf("127.0.0.1:%d", *port))
	if err != nil {
		fatal("无法启动本地服务：%v", err)
	}
	httpPort = ln.Addr().(*net.TCPAddr).Port
	baseURL = fmt.Sprintf("http://127.0.0.1:%d/", httpPort)
	writeInstance()

	srv := &http.Server{
		Handler:      mux,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 180 * time.Second,
	}

	printBanner()

	if !*noBrowser {
		go func() {
			time.Sleep(320 * time.Millisecond)
			openBrowser(baseURL)
		}()
	}

	if err := srv.Serve(ln); err != nil && !errors.Is(err, http.ErrServerClosed) {
		fatal("服务异常退出：%v", err)
	}
}

var (
	storeDir     string
	instancePath string
)

/* ------------------------------ 单实例 ------------------------------ */

type instanceInfo struct {
	PID  int    `json:"pid"`
	Port int    `json:"port"`
	URL  string `json:"url"`
}

func writeInstance() {
	b, _ := json.Marshal(instanceInfo{PID: os.Getpid(), Port: httpPort, URL: baseURL})
	_ = os.WriteFile(instancePath, b, 0o644)
}

// runningInstance 检查是否已有存活实例；只有端口可连、且确实返回本程序的首页才认。
func runningInstance() (string, bool) {
	b, err := os.ReadFile(instancePath)
	if err != nil {
		return "", false
	}
	var info instanceInfo
	if json.Unmarshal(b, &info) != nil || info.Port <= 0 {
		return "", false
	}
	addr := fmt.Sprintf("127.0.0.1:%d", info.Port)
	conn, err := net.DialTimeout("tcp", addr, 400*time.Millisecond)
	if err != nil {
		return "", false // 端口已释放，是上次的残留文件
	}
	_ = conn.Close()

	client := &http.Client{Timeout: 2 * time.Second}
	res, err := client.Get("http://" + addr + "/")
	if err != nil {
		return "", false
	}
	defer res.Body.Close()
	head, _ := io.ReadAll(io.LimitReader(res.Body, 8192))
	if !bytes.Contains(head, []byte("__RESUME_TOKEN__")) {
		return "", false // 端口被别的程序占了
	}
	return "http://" + addr + "/", true
}

// shutdown 退出前清掉实例标记，免得下次启动误判。
func shutdown(code int) {
	if instancePath != "" {
		_ = os.Remove(instancePath)
	}
	os.Exit(code)
}

// initConsole 把控制台代码页切到 UTF-8，否则双击运行时中文横幅是乱码。
func initConsole() {
	if runtime.GOOS != "windows" {
		return
	}
	kernel32 := syscall.NewLazyDLL("kernel32.dll")
	if p := kernel32.NewProc("SetConsoleOutputCP"); p.Find() == nil {
		_, _, _ = p.Call(uintptr(65001))
	}
	if p := kernel32.NewProc("SetConsoleCP"); p.Find() == nil {
		_, _, _ = p.Call(uintptr(65001))
	}
}

func printBanner() {
	fmt.Println()
	fmt.Println("  ══════════════════════════════════════")
	fmt.Println("   简 历 工 坊  ·  ResumeMaker  v" + version)
	fmt.Println("  ══════════════════════════════════════")
	fmt.Println()
	fmt.Println("   访问地址 : " + baseURL)
	fmt.Println("   数据目录 : " + storeDir)
	fmt.Println("   导出目录 : " + exportDir())
	fmt.Println()
	fmt.Println("   浏览器若未自动打开，请手动复制上面的访问地址。")
	fmt.Println("   关闭本窗口即可退出程序（或在页面上点「退出」）。")
	fmt.Println()
}

func fatal(format string, a ...any) {
	log.Printf("✖ "+format, a...)
	if runtime.GOOS == "windows" {
		fmt.Println("\n按回车键退出…")
		fmt.Scanln()
	}
	os.Exit(1)
}

func randomToken() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(b)
}

/* ------------------------------ 路径 ------------------------------ */

func defaultStoreDir() string {
	if appData := os.Getenv("APPDATA"); appData != "" {
		return filepath.Join(appData, "ResumeMaker")
	}
	if exe, err := os.Executable(); err == nil {
		return filepath.Join(filepath.Dir(exe), "data")
	}
	return "data"
}

func resumeFile() string { return filepath.Join(storeDir, "resume.json") }

var (
	exportDirOnce sync.Once
	exportDirPath string
)

// exportDir 返回可写的导出目录（优先「文档\简历导出」，不可写时退到数据目录）。
func exportDir() string {
	exportDirOnce.Do(func() {
		exportDirPath = pickExportDir()
	})
	return exportDirPath
}

func pickExportDir() string {
	home, _ := os.UserHomeDir()
	var bases []string
	seen := map[string]bool{}
	add := func(p string) {
		if p == "" || seen[p] {
			return
		}
		seen[p] = true
		bases = append(bases, p)
	}
	if up := os.Getenv("USERPROFILE"); up != "" {
		add(filepath.Join(up, "Documents"))
		add(filepath.Join(up, "OneDrive", "Documents"))
	}
	if home != "" {
		add(filepath.Join(home, "Documents"))
	}
	// 下面两个兜底位置几乎一定可写。
	if d, err := os.UserCacheDir(); err == nil {
		add(filepath.Join(d, "ResumeMaker"))
	}
	add(storeDir)
	add(os.TempDir())

	for _, base := range bases {
		if st, err := os.Stat(base); err == nil && !st.IsDir() {
			continue
		}
		dir := filepath.Join(base, "简历导出")
		if base == storeDir || base == os.TempDir() {
			dir = base
		}
		if writable(dir) {
			return dir
		}
		// 退一步：直接写在该基础目录下
		if writable(base) {
			return filepath.Join(base, "简历导出")
		}
	}
	return os.TempDir()
}

// writable 创建目录并试写一个临时文件，确认真的能落盘。
func writable(dir string) bool {
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return false
	}
	f, err := os.CreateTemp(dir, ".w-*")
	if err != nil {
		return false
	}
	name := f.Name()
	f.Close()
	_ = os.Remove(name)
	return true
}

/* ------------------------------ 存档 ------------------------------ */

func loadResume() {
	b, err := os.ReadFile(resumeFile())
	if err != nil {
		return
	}
	if json.Valid(b) {
		resumeJS = json.RawMessage(b)
	}
}

func saveResume(raw []byte) error {
	if !json.Valid(raw) {
		return errors.New("简历数据格式不正确")
	}
	tmp := resumeFile() + ".tmp"
	if err := os.WriteFile(tmp, raw, 0o644); err != nil {
		return err
	}
	if err := os.Rename(tmp, resumeFile()); err != nil {
		_ = os.Remove(tmp)
		return err
	}
	resumeJS = json.RawMessage(raw)
	return nil
}

/* ------------------------------ 路由 ------------------------------ */

func buildRouter() http.Handler {
	mux := http.NewServeMux()
	sub, _ := fs.Sub(embeddedWeb, "web")

	mux.HandleFunc("/api/resume", guard(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			mu.Lock()
			raw := resumeJS
			mu.Unlock()
			var data any
			if len(raw) > 0 {
				data = map[string]any{"resume": raw}
			} else {
				data = map[string]any{"resume": nil}
			}
			writeJSON(w, map[string]any{
				"ok":        true,
				"data":      data,
				"exportDir": exportDir(),
				"version":   version,
			})
		case http.MethodPost:
			body, err := io.ReadAll(io.LimitReader(r.Body, 64<<20))
			if err != nil {
				writeErr(w, 400, "读取数据失败")
				return
			}
			mu.Lock()
			err = saveResume(body)
			mu.Unlock()
			if err != nil {
				writeErr(w, 500, "保存失败："+err.Error())
				return
			}
			writeJSON(w, map[string]any{"ok": true})
		default:
			writeErr(w, 405, "不支持的请求方法")
		}
	}))

	mux.HandleFunc("/api/export", guard(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeErr(w, 405, "不支持的请求方法")
			return
		}
		var req struct {
			Kind string `json:"kind"`
			Name string `json:"name"`
			Data string `json:"data"`
		}
		if err := json.NewDecoder(io.LimitReader(r.Body, 128<<20)).Decode(&req); err != nil {
			writeErr(w, 400, "请求格式不正确")
			return
		}
		if req.Data == "" {
			writeErr(w, 400, "没有可保存的图片数据")
			return
		}
		raw, err := base64.StdEncoding.DecodeString(req.Data)
		if err != nil {
			writeErr(w, 400, "图片数据解码失败")
			return
		}
		if len(raw) < 32 {
			writeErr(w, 400, "图片数据不完整")
			return
		}
		name := sanitizeName(req.Name)
		if name == "" {
			ext := "png"
			if req.Kind == "avatar" {
				ext = "jpg"
			}
			name = "简历_" + time.Now().Format("20060102_150405") + "." + ext
		}
		if filepath.Ext(name) == "" {
			if req.Kind == "avatar" {
				name += ".jpg"
			} else {
				name += ".png"
			}
		}
		path, err := writeFileUnique(exportDir(), name, raw)
		if err != nil {
			writeErr(w, 500, "写入文件失败："+err.Error())
			return
		}
		log.Printf("已导出 %s → %s", req.Kind, path)
		writeJSON(w, map[string]any{"ok": true, "path": path})
	}))

	mux.HandleFunc("/api/pdf", guard(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeErr(w, 405, "不支持的请求方法")
			return
		}
		var req struct {
			Name string `json:"name"`
			Data string `json:"data"` // 兜底：前端截图的 base64 PNG
		}
		_ = json.NewDecoder(io.LimitReader(r.Body, 256<<20)).Decode(&req)
		name := sanitizeName(req.Name)
		if name == "" || !strings.EqualFold(filepath.Ext(name), ".pdf") {
			name = "简历_" + time.Now().Format("20060102_150405") + ".pdf"
		}
		out := uniquePath(exportDir(), name)

		// 优先用浏览器内核直接打印（文字可选中、体积小、清晰）。
		err := printPDF(out)
		if err != nil {
			// 兜底：用前端截图拼成图片型 PDF。
			if req.Data != "" {
				pdfBytes, perr := imagePDF(req.Data)
				if perr != nil {
					writeErr(w, 500, err.Error()+"；兜底方案也失败："+perr.Error())
					return
				}
				if werr := os.WriteFile(out, pdfBytes, 0o644); werr != nil {
					writeErr(w, 500, "写入 PDF 失败："+werr.Error())
					return
				}
			} else {
				writeErr(w, 500, err.Error())
				return
			}
		}
		log.Printf("已导出 PDF → %s", out)
		writeJSON(w, map[string]any{"ok": true, "path": out})
	}))

	mux.HandleFunc("/api/quit", guard(func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, map[string]any{"ok": true})
		go func() {
			time.Sleep(350 * time.Millisecond)
			log.Println("已按用户请求退出。")
			shutdown(0)
		}()
	}))

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		p := strings.TrimPrefix(r.URL.Path, "/")
		if p == "" || p == "index.html" {
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Header().Set("Cache-Control", "no-store")
			b, err := fs.ReadFile(sub, "index.html")
			if err != nil {
				http.Error(w, "index.html 缺失", 500)
				return
			}
			b = bytes.ReplaceAll(b, []byte("{{TOKEN}}"), []byte(token))
			_, _ = w.Write(b)
			return
		}
		b, err := fs.ReadFile(sub, p)
		if err != nil {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", contentType(p))
		w.Header().Set("Cache-Control", "no-store")
		_, _ = w.Write(b)
	})
	return mux
}

func contentType(p string) string {
	switch strings.ToLower(filepath.Ext(p)) {
	case ".css":
		return "text/css; charset=utf-8"
	case ".js":
		return "application/javascript; charset=utf-8"
	case ".html":
		return "text/html; charset=utf-8"
	case ".json":
		return "application/json; charset=utf-8"
	case ".svg":
		return "image/svg+xml"
	case ".png":
		return "image/png"
	case ".ico":
		return "image/x-icon"
	default:
		return "application/octet-stream"
	}
}

// guard 校验本机页面令牌，避免其它网页随意调用本地接口。
func guard(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		t := r.Header.Get("X-Resume-Token")
		if t == "" {
			t = r.URL.Query().Get("t")
		}
		if t != token {
			writeErr(w, 403, "令牌校验失败")
			return
		}
		w.Header().Set("X-Content-Type-Options", "nosniff")
		h(w, r)
	}
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(false)
	_ = enc.Encode(v)
}

func writeErr(w http.ResponseWriter, code int, msg string) {
	log.Printf("✖ %s", msg)
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(map[string]any{"ok": false, "error": msg})
}

/* ------------------------------ 文件名 ------------------------------ */

var illegalChars = regexp.MustCompile(`[\\/:*?"<>|\r\n\t]+`)

func sanitizeName(name string) string {
	name = strings.TrimSpace(name)
	name = illegalChars.ReplaceAllString(name, "_")
	name = strings.Trim(name, " .")
	if len([]rune(name)) > 90 {
		r := []rune(name)
		ext := filepath.Ext(name)
		base := strings.TrimSuffix(string(r), ext)
		br := []rune(base)
		if len(br) > 70 {
			br = br[:70]
		}
		name = string(br) + ext
	}
	return name
}

func uniquePath(dir, name string) string {
	path := filepath.Join(dir, name)
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return path
	}
	ext := filepath.Ext(name)
	base := strings.TrimSuffix(name, ext)
	for i := 2; i < 1000; i++ {
		p := filepath.Join(dir, fmt.Sprintf("%s (%d)%s", base, i, ext))
		if _, err := os.Stat(p); os.IsNotExist(err) {
			return p
		}
	}
	return filepath.Join(dir, fmt.Sprintf("%s_%d%s", base, time.Now().UnixNano(), ext))
}

func writeFileUnique(dir, name string, data []byte) (string, error) {
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	path := uniquePath(dir, name)
	if err := os.WriteFile(path, data, 0o644); err != nil {
		return "", err
	}
	return path, nil
}

/* ------------------------------ 打开浏览器 ------------------------------ */

func openBrowser(url string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	case "darwin":
		cmd = exec.Command("open", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	if err := cmd.Start(); err != nil {
		log.Printf("⚠ 自动打开浏览器失败（%v），请手动访问：%s", err, url)
		return
	}
	go func() { _ = cmd.Wait() }()
}

/* ------------------------------ PDF 导出 ------------------------------ */

// findBrowser 在本机寻找可用于 headless 打印的 Chromium 内核浏览器。
func findBrowser() (string, error) {
	env := os.Environ()
	var candidates []string
	get := func(k string) string {
		for _, kv := range env {
			if strings.HasPrefix(strings.ToUpper(kv), strings.ToUpper(k)+"=") {
				return kv[len(k)+1:]
			}
		}
		return ""
	}
	for _, root := range []string{get("ProgramFiles"), get("ProgramFiles(x86)"), get("LOCALAPPDATA")} {
		if root == "" {
			continue
		}
		candidates = append(candidates,
			filepath.Join(root, "Microsoft", "Edge", "Application", "msedge.exe"),
			filepath.Join(root, "Google", "Chrome", "Application", "chrome.exe"),
			filepath.Join(root, "Google", "Chrome Beta", "Application", "chrome.exe"),
			filepath.Join(root, "Chromium", "Application", "chrome.exe"),
			filepath.Join(root, "BraveSoftware", "Brave-Browser", "Application", "brave.exe"),
			filepath.Join(root, "Vivaldi", "Application", "vivaldi.exe"),
		)
	}
	for _, name := range []string{"msedge", "chrome", "chromium", "brave"} {
		if p, err := exec.LookPath(name); err == nil {
			candidates = append(candidates, p)
		}
	}
	for _, c := range candidates {
		if st, err := os.Stat(c); err == nil && !st.IsDir() {
			return c, nil
		}
	}
	return "", errors.New("未找到 Edge / Chrome 浏览器，无法生成 PDF")
}

func printPDF(out string) error {
	browser, err := findBrowser()
	if err != nil {
		return errors.New("本机未找到 Edge 或 Chrome，无法直接生成 PDF。已改用浏览器打印方式。")
	}
	if err := os.MkdirAll(filepath.Dir(out), 0o755); err != nil {
		return err
	}
	tmpProfile, err := os.MkdirTemp("", "resume-print-")
	if err != nil {
		return errors.New("无法创建临时目录：" + err.Error())
	}
	defer os.RemoveAll(tmpProfile)

	url := fmt.Sprintf("%s?mode=print&t=%s", baseURL, token)
	args := []string{
		"--headless=new",
		"--disable-gpu",
		"--hide-scrollbars",
		"--no-first-run",
		"--no-default-browser-check",
		"--disable-extensions",
		"--disable-background-networking",
		"--disable-sync",
		"--no-pdf-header-footer",
		"--print-to-pdf-no-header",
		"--run-all-compositor-stages-before-draw",
		"--virtual-time-budget=6000",
		"--user-data-dir=" + tmpProfile,
		"--print-to-pdf=" + out,
		url,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, browser, args...)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	cmd.Stdout = io.Discard
	runErr := cmd.Run()

	st, statErr := os.Stat(out)
	if statErr != nil || st.Size() < 1024 {
		msg := strings.TrimSpace(stderr.String())
		if len(msg) > 400 {
			msg = msg[len(msg)-400:]
		}
		if runErr != nil {
			return fmt.Errorf("PDF 生成失败：%v %s", runErr, msg)
		}
		return errors.New("PDF 生成失败：未产出有效文件")
	}
	return nil
}
