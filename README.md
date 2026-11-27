# 简历工坊 · ResumeMaker

一个用 **Go** 写的本地简历制作工具。编译产物是**单个 EXE**，双击后自动起一个只在本机回环地址（`127.0.0.1`）上监听的服务，并自动打开浏览器进入编辑器。

- **左侧编辑 · 右侧实时预览**，所见即所得的 A4 排版
- **模块化**：工作经历、项目经历、教育背景、技能标签、自定义文本，可自由增删、上下调序、切换主栏/辅栏
- **4 套模板 × 6 套配色**，一键切换
- **头像**：鼠标移到预览里的头像上会浮出两个小按钮 —— 「换」上传新头像、「存图」把这张头像单独保存成 JPG；左侧编辑器里也有对应的「选择图片…／保存头像文件／清除」
- **保存图片**：把整份简历渲染成高清 PNG（2 倍分辨率）存到本地
- **导出 PDF**：优先用本机浏览器内核直接「打印」成矢量 PDF（文字可选中、可检索）；若本机没有可用的 Chromium 内核浏览器，自动降级为图片型 PDF，保证一定能导出
- **数据不出本机**：所有内容存在本机 JSON 文件里，服务只监听 `127.0.0.1`，且接口带随机令牌校验，其它网页无法调用

---

## 一、直接使用（无需安装 Go）

```
简历工坊.exe
```

双击即可。程序会：

1. 在本机随机端口起一个 HTTP 服务（只绑定 `127.0.0.1`，外部访问不到）
2. 自动打开默认浏览器
3. 在控制台窗口打印访问地址，若浏览器没自动打开可手动复制

关闭控制台窗口即退出；也可以在页面右上角点「退出」。

### 常用命令行参数

| 参数 | 说明 |
| --- | --- |
| `-port 8080` | 指定端口（默认随机） |
| `-no-browser` | 不自动打开浏览器 |
| `-data D:\mydata` | 指定数据目录（默认 `%APPDATA%\ResumeMaker`） |

已经有一个实例在跑时，再次双击不会启动第二个实例，而是直接把浏览器切到已打开的窗口，避免两份存档互相覆盖。

---

## 二、文件位置

| 内容 | 位置 |
| --- | --- |
| 简历存档 | `%APPDATA%\ResumeMaker\resume.json`（自动保存，约 0.9 秒防抖） |
| 导出的图片 / PDF | `文档\简历导出\`（若「文档」不可写，自动退到数据目录） |
| 运行状态标记 | `%APPDATA%\ResumeMaker\instance.json` |

页面底部状态栏会直接显示当前的**导出目录**完整路径，导出成功后还会用提示条告诉你文件的绝对路径。

---

## 三、从源码编译

需要 Go **1.21 或更高**。

### 方式一：双击 `build.bat`

### 方式二：命令行

```bat
cd resume-maker
go build -trimpath -ldflags "-s -w" -o 简历工坊.exe .
```

产物约 7 MB，**前端已通过 `go:embed` 打进 exe**，分发时只需要这一个文件。

> 如果编译时遇到临时目录权限相关的报错，可以先把缓存目录指到项目内：
>
> ```bat
> set GOCACHE=%cd%\.gocache
> set GOTMPDIR=%cd%\.gotmp
> ```

---

## 四、项目结构

```
resume-maker/
├─ main.go            服务入口：路由、鉴权、存档、导出、单实例、开浏览器
├─ pdfgen.go          纯 Go 兜底方案：把整页截图拼成 A4 多页 PDF
├─ go.mod
├─ build.bat          一键编译
└─ web/               前端（embed 进 exe）
   ├─ index.html
   ├─ style.css       编辑器 / A4 纸面 / 打印样式
   ├─ app.js          全部交互逻辑
   └─ vendor/
      └─ html2canvas.min.js   整页截图用（MIT）
```

### 后端接口

所有 `/api/*` 接口都要求请求头 `X-Resume-Token` 与页面注入的随机令牌一致，否则返回 `403`。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/resume` | 读取存档，返回 `{ok, data:{resume}, exportDir, version}` |
| POST | `/api/resume` | 保存存档（请求体即简历 JSON，原子写入） |
| POST | `/api/export` | `{kind:"png"\|"avatar", name, data}`，写盘并返回 `{path}` |
| POST | `/api/pdf` | `{name, data?}`，返回 `{path}`；`data` 为前端截图兜底用 |
| POST | `/api/quit` | 退出程序 |

---

## 五、关于 PDF 的两种实现

1. **首选：浏览器内核打印**
   调用本机 Edge / Chrome / Brave / Vivaldi 的 headless 模式 `--print-to-pdf`，产出真正的矢量 PDF，文字可选中、体积小、打印清晰。会依次在 `ProgramFiles`、`ProgramFiles(x86)`、`LOCALAPPDATA` 下查找。

2. **兜底：图片型 PDF**（`pdfgen.go`）
   找不到浏览器、或 headless 被安全软件拦下时，用前端整页截图按 A4 比例切页、JPEG 压缩后手工拼装 PDF 1.4 结构。清晰度略低且文字不可选中，但**保证一定能导出**。

两种都失败时（例如浏览器完全不可用），页面会退回调用 `window.print()`，由你在打印对话框里选「另存为 PDF」。

---

## 六、数据格式

存档就是一个普通 JSON，可以随时用「导出 JSON」备份、「导入」恢复：

```json
{
  "meta": { "name": "张明远", "job": "高级前端工程师", "phone": "…", "avatar": "data:image/jpeg;base64,…" },
  "theme": { "color": "blue", "template": "modern" },
  "sections": [
    { "id": "…", "type": "experience", "title": "工作经历", "col": "main",
      "items": [ { "role": "公司", "title": "职位", "start": "2021.03", "end": "至今", "desc": "每行一条要点" } ] },
    { "id": "…", "type": "skills", "title": "专业技能", "col": "side", "tags": "Go, Redis" },
    { "id": "…", "type": "custom", "title": "自我评价", "col": "side", "text": "……" }
  ]
}
```

`type` 可选：`experience` / `project` / `education`（条目型）、`skills`（标签型）、`custom`（文本型）。
`col` 可选：`main`（主栏）/ `side`（辅栏，单栏模板下忽略）。
`theme.color`：`blue` / `ink` / `green` / `amber` / `violet` / `teal`；`theme.template`：`modern` / `accent` / `classic` / `compact`。

---

## 七、常见问题

**双击后浏览器没打开？**
看控制台窗口里打印的地址，手动复制到浏览器打开。也可以加 `-no-browser` 后自己访问。

**提示端口被占用？**
加 `-port 8080`（或任意空闲端口）重新启动。

**导出的 PDF 里文字选不中？**
说明走的是图片型兜底方案，本机没找到可用于 headless 打印的浏览器。安装 Edge 或 Chrome 后重新导出即可得到矢量 PDF。

**想换电脑用？**
把 `%APPDATA%\ResumeMaker\resume.json` 一起拷走，或者用页面上的「导出 JSON」备份。

**会不会把简历上传到网上？**
不会。服务只绑定回环地址，没有任何外部请求；html2canvas 也已经内嵌在 exe 里，运行时不联网。

---

## 八、第三方组件

- [html2canvas](https://html2canvas.hertzen.com/) 1.4.1 — MIT License，用于把预览整页渲染成 PNG。

其余代码均为本项目自写，无其它第三方依赖。
