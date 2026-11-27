# 简历工具 · Resume Tool

[![Build](https://github.com/sshpc/resume-make-go/actions/workflows/build.yml/badge.svg)](https://github.com/sshpc/resume-make-go/actions/workflows/build.yml)
[![Release](https://img.shields.io/github/v/release/sshpc/resume-make-go?display_name=tag)](https://github.com/sshpc/resume-make-go/releases)
[![Go](https://img.shields.io/badge/Go-1.21%2B-00ADD8?logo=go&logoColor=white)](https://go.dev/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

一个用 **Go** 写的本地简历制作工具。编译产物是**单个可执行文件**，双击后自动在 `127.0.0.1` 上起一个本地服务并打开浏览器进入编辑器 —— 不用安装任何环境，不联网，简历数据只留在你自己的电脑上。

- **左侧编辑 · 右侧实时预览**，所见即所得的 A4 排版
- **模块化**：工作经历、项目经历、教育背景、技能标签、自定义文本，可自由增删、上下调序、切换主栏 / 辅栏
- **5 套版式 × 6 套配色 × 3 档密度**，一键切换；「密度（紧凑 / 标准 / 宽松）」对**所有版式**都生效
- **全局排版可调**：正文字号、标题字号、行间距、模块间距、条目间距，以及纸张的上 / 右 / 下 / 左边距 —— 都在左侧「排版与页面」里实时改
- **基本信息自由配置**：手机、邮箱、城市、性别、出生年月、工作年限、个人主页，每一项都能**改名**、**单独隐藏**；名称后的冒号可选全角 / 半角 / 不显示
- **富文本描述**：每个要点的描述是富文本编辑框，支持**加粗 / 斜体 / 下划线 / 有序列表 / 无序列表**，回车自动续写成列表项
- **项目符号可选**：无序列表的符号能选**小方块 / 小黑点 / 小圆圈 / 不显示**
- **分页参考线**：内容超过一页时，预览里会画出 A4 分页虚线，方便对照调整
- **头像**：鼠标移到预览里的头像上会浮出两个小按钮 —— 「换」上传新头像、「存图」把这张头像单独存成 JPG；左侧编辑器里也有「选择图片… / 保存头像文件 / 清除」
- **保存图片**：把整份简历渲染成 2 倍分辨率的 PNG
- **导出 PDF**：优先用本机浏览器内核「打印」成矢量 PDF（文字可选中、可检索）；没有可用的 Chromium 内核时自动降级为图片型 PDF，保证一定导得出来
- **数据不出本机**：存档就是本机一个 JSON 文件，服务只绑定回环地址，接口带随机令牌校验，别的网页调不动

---

## 一、下载即用

到 [**Releases**](https://github.com/sshpc/resume-make-go/releases) 下载对应平台的压缩包，解压后直接运行，不需要安装 Go 或任何依赖。每个压缩包旁边都配有同名的 `.sha256` 校验文件，需要时可以用 `sha256sum -c` 验证下载完整性。

| 平台 | 压缩包 | 解压后 |
| --- | --- | --- |
| Windows x64 | `resume-tool-windows-amd64.exe.zip` | `resume-tool-windows-amd64.exe` |
| Windows ARM64 | `resume-tool-windows-arm64.exe.zip` | `resume-tool-windows-arm64.exe` |
| Linux x64 | `resume-tool-linux-amd64.zip` | `resume-tool-linux-amd64` |
| Linux ARM64 | `resume-tool-linux-arm64.zip` | `resume-tool-linux-arm64` |
| macOS Intel | `resume-tool-darwin-amd64.zip` | `resume-tool-darwin-amd64` |
| macOS Apple Silicon | `resume-tool-darwin-arm64.zip` | `resume-tool-darwin-arm64` |

> Linux / macOS 上解压后先 `chmod +x` 再运行。macOS 若提示「无法打开，因为来自身份不明的开发者」，在终端里执行
> `xattr -d com.apple.quarantine ./resume-tool-darwin-arm64` 即可。
> 自己需要改个名字的话，重命名可执行文件完全不影响使用。

Windows 双击 `resume-tool-windows-amd64.exe`，程序会：

1. 在本机随机端口起一个 HTTP 服务（只绑定 `127.0.0.1`，外部访问不到）
2. 自动打开默认浏览器
3. 在控制台窗口打印访问地址，浏览器没自动打开时手动复制即可

关闭控制台窗口即退出；也可以在页面右上角点「退出」。已经有一个实例在跑时，再次双击不会启动第二个实例，而是直接把浏览器切到已打开的那个窗口，避免两份存档互相覆盖。

### 命令行参数

| 参数 | 说明 |
| --- | --- |
| `-port 8080` | 指定端口（默认随机空闲端口） |
| `-no-browser` | 不自动打开浏览器 |
| `-data D:\mydata` | 指定数据目录（默认 `%APPDATA%\ResumeTool`） |

---

## 二、文件位置

| 内容 | Windows | Linux / macOS |
| --- | --- | --- |
| 简历存档 | `%APPDATA%\ResumeTool\resume.json` | `~/.config/ResumeTool/resume.json` |
| 导出的图片 / PDF | `文档\简历导出\` | `~/文档/简历导出/`（遵循 XDG 用户目录） |
| 运行状态标记 | `%APPDATA%\ResumeTool\instance.json` | `~/.config/ResumeTool/instance.json` |

页面底部状态栏会直接显示当前的**导出目录**完整路径，导出成功后还会用提示条告诉你文件的绝对路径。若「文档」目录不可写，会自动退到缓存目录或数据目录，不会因此导出失败。

> 从旧版本（ResumeMaker）升级时，若新目录不存在而旧目录存在，程序会继续沿用旧目录，不会丢存档。

---

## 三、从源码编译

需要 Go **1.21 或更高**。

### 方式一：双击 `build.bat`（Windows）

加参数 `build.bat all` 可一次交叉编译出全部 6 个平台的产物，输出到 `dist\`。

### 方式二：命令行

```bash
git clone git@github.com:sshpc/resume-make-go.git
cd resume-make-go

# 本机版本
go build -trimpath -ldflags "-s -w" -o dist/resume-tool .

# 交叉编译（以 Linux x64 为例）
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
  go build -trimpath -ldflags "-s -w" -o dist/resume-tool-linux-amd64 .
```

产物约 7 MB，**前端已通过 `go:embed` 打进可执行文件**，分发时只需要这一个文件。

> 如果编译时遇到临时目录权限相关的报错，可以先把缓存目录指到项目内：
>
> ```bat
> set GOCACHE=%cd%\.gocache
> set GOTMPDIR=%cd%\.gotmp
> ```

### 方式三：GitHub Actions 自动编译

仓库里带了一条工作流 [`.github/workflows/build.yml`](.github/workflows/build.yml)：

| 触发方式 | 作用 |
| --- | --- |
| 推送到 `main` | 跑 `gofmt` / `go vet`，并交叉编译 6 个平台的可执行文件，产物在本次运行记录的 **Artifacts** 里可下载 |
| 提 Pull Request | 只跑检查，产物不打 |
| 手动触发（Actions 页面 → Run workflow） | 同「推送到 main」 |
| 推 `v*` 标签 | 在以上基础上**自动创建 Release**，把 6 个平台的 zip 和 sha256 校验文件挂上去 |

发一个新版本的完整流程：

```bash
git tag v1.2.0
git push origin v1.2.0
```

等 Actions 跑完，Releases 页面就会出现带全部平台产物的新版本；想提前验证 CI 是否正常，先手动触发一次 `Build` 工作流即可。

---

## 四、项目结构

```
.
├─ main.go                 服务入口：路由、鉴权、存档、导出、单实例、开浏览器
├─ pdfgen.go               纯 Go 兜底方案：把整页截图拼成 A4 多页 PDF
├─ console_windows.go      Windows 控制台切换 UTF-8 代码页
├─ console_other.go        其它平台的空实现
├─ go.mod
├─ build.bat               Windows 一键编译（支持 all 参数交叉编译）
├─ .github/workflows/
│  └─ build.yml            多平台编译 + 打 tag 自动发版
└─ web/                    前端（embed 进可执行文件）
   ├─ index.html
   ├─ style.css            编辑器 / A4 纸面 / 打印样式
   ├─ app.js               全部交互逻辑
   └─ vendor/
      └─ html2canvas.min.js  整页截图用（MIT）
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
   调用本机 Edge / Chrome / Chromium / Brave / Vivaldi 的 headless 模式 `--print-to-pdf`，产出真正的矢量 PDF，文字可选中、体积小、打印清晰。Windows 会查 `ProgramFiles`、`ProgramFiles(x86)`、`LOCALAPPDATA`；macOS 会查 `/Applications/*.app`；Linux 会查常见包管理路径以及 `snap` / `flatpak`。

2. **兜底：图片型 PDF**（`pdfgen.go`）
   找不到浏览器、或 headless 被安全软件拦下时，用前端整页截图按 A4 比例切页、JPEG 压缩后手工拼装 PDF 1.4 结构。清晰度略低且文字不可选中，但**保证一定能导出**。

两种都失败时，页面会退回调用 `window.print()`，由你在打印对话框里选「另存为 PDF」。

---

## 六、数据格式

存档就是一个普通 JSON，可以随时用「导出 JSON」备份、「导入」恢复：

```json
{
  "meta": { "name": "张明远", "job": "高级前端工程师", "phone": "…", "avatar": "data:image/jpeg;base64,…" },
  "metaFields": [ { "key": "phone", "label": "联系电话", "show": true } ],
  "theme": { "color": "blue", "template": "modern" },
  "layout": {
    "fsBody": 13, "fsHead": 14.5, "lhBody": 1.7, "gapSec": 17, "gapItem": 11,
    "padT": 52, "padR": 56, "padB": 52, "padL": 56,
    "bullet": "diamond", "colon": "：", "showLabel": true, "sideLeft": false
  },
  "sections": [
    { "id": "…", "type": "experience", "title": "工作经历", "col": "main",
      "items": [ { "role": "公司", "title": "职位", "start": "2021.03", "end": "至今",
                   "desc": "<ul><li>负责<b>渲染引擎</b>重构</li><li>搭建组件库</li></ul>" } ] },
    { "id": "…", "type": "skills", "title": "专业技能", "col": "side", "tags": "Go, Redis" },
    { "id": "…", "type": "custom", "title": "自我评价", "col": "side", "text": "……" }
  ]
}
```

`type` 可选：`experience` / `project` / `education`（条目型）、`skills`（标签型）、`custom`（文本型）。
`col` 可选：`main`（主栏）/ `side`（辅栏，单栏版式下忽略）。
`theme.color`：`blue` / `ink` / `green` / `amber` / `violet` / `teal`。
`theme.template`（版式）：`modern`（现代双栏）/ `accent`（侧栏色块）/ `classic`（经典单栏）/ `banner`（顶栏色带）/ `minimal`（极简）。
`layout.bullet`（无序列表符号）：`diamond` / `disc` / `circle` / `none`；`layout.colon`：`""`（不显示）/ `"："` / `":"`。
`desc` 是**富文本 HTML**，只保留 `b / strong / i / em / u / br / p / div / ul / ol / li`，其余标签与所有属性都会在导入时被剥掉。旧版本导出的纯文本 `desc`（每行一条）在导入时会自动转换成无序列表，不会丢内容。

---

## 七、常见问题

**双击后浏览器没打开？**
看控制台窗口里打印的地址，手动复制到浏览器打开。也可以加 `-no-browser` 后自己访问。

**提示端口被占用？**
加 `-port 8080`（或任意空闲端口）重新启动。

**导出的 PDF 里文字选不中？**
说明走的是图片型兜底方案，本机没找到可用于 headless 打印的浏览器。安装 Edge、Chrome 或 Chromium 后重新导出即可得到矢量 PDF。

**Linux 上没有浏览器，PDF 怎么办？**
`apt install chromium`（或 `chromium-browser`）之后重新导出即可得到矢量 PDF；不装也能导出，只是变成图片型。

**想换电脑用？**
把存档文件一起拷走，或者用页面上的「导出 JSON」备份、在新电脑上「导入」。

**会不会把简历上传到网上？**
不会。服务只绑定回环地址，运行时不发起任何外部请求；html2canvas 已经内嵌在可执行文件里。

---

## 八、第三方组件

- [html2canvas](https://html2canvas.hertzen.com/) 1.4.1 — MIT License，用于把预览整页渲染成 PNG。

其余代码均为本项目自写，无其它第三方依赖。

---

## English

A single-binary local resume builder written in Go. Run the executable, it starts a loopback-only HTTP server on `127.0.0.1`, opens your browser, and gives you a split editor: edit on the left, live A4 preview on the right.

Features: 5 layouts × 6 color themes × 3 density presets, a global typography panel (body/heading font size, line height, section & item spacing, page margins), per-field renaming and hiding for the contact info, bullet-style selection for unordered lists, drag-free section reordering, page-break guides, a rich-text description editor (bold / italic / underline / ordered & unordered lists), avatar upload with a one-click "save avatar image" button, full-page PNG export, and PDF export (vector via headless Chromium when available, image-based fallback otherwise). Everything runs offline; your data never leaves the machine.

Download the binary for your platform from [Releases](https://github.com/sshpc/resume-make-go/releases) — no Go or runtime needed. To build from source: `go build -trimpath -ldflags "-s -w" -o dist/resume-tool .` (Go 1.21+).

Push a `v*` tag to have GitHub Actions cross-compile Windows / Linux / macOS binaries and publish them automatically.

## License

[MIT](LICENSE)
