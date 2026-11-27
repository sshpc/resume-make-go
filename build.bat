@echo off
REM ============================================================
REM  Resume Tool / 简历工具  -  一键编译脚本（Windows）
REM  产物：dist\resume-tool.exe（单个文件，前端已内嵌）
REM  加参数 build.bat all 可交叉编译出 Linux / macOS 版本
REM ============================================================
setlocal enabledelayedexpansion

cd /d "%~dp0"

REM 把 Go 的缓存放到当前目录的子文件夹里，避免受系统临时目录权限影响。
set "GOCACHE=%~dp0.gocache"
set "GOTMPDIR=%~dp0.gotmp"
if not exist "%GOCACHE%" mkdir "%GOCACHE%"
if not exist "%GOTMPDIR%" mkdir "%GOTMPDIR%"
if not exist "%~dp0dist" mkdir "%~dp0dist"

set "LDFLAGS=-s -w"

if /i "%~1"=="all" goto matrix

echo.
echo  正在编译 dist\resume-tool.exe ...
echo.
go build -trimpath -ldflags "%LDFLAGS%" -o "dist\resume-tool.exe" .
if errorlevel 1 goto fail

echo.
echo  [成功] 已生成：%~dp0dist\resume-tool.exe
for %%A in ("dist\resume-tool.exe") do echo         文件大小：%%~zA 字节
echo.
echo  双击它即可使用（会自动打开浏览器）。
echo.
pause
exit /b 0

:matrix
set "CGO_ENABLED=0"
for %%T in (windows/amd64 windows/arm64 linux/amd64 linux/arm64 darwin/amd64 darwin/arm64) do (
  for /f "tokens=1,2 delims=/" %%A in ("%%T") do (
    set "GOOS=%%A"
    set "GOARCH=%%B"
    set "OUT=dist\resume-tool-%%A-%%B"
    if "%%A"=="windows" set "OUT=!OUT!.exe"
    echo.
    echo  正在编译 !OUT! ...
    go build -trimpath -ldflags "%LDFLAGS%" -o "!OUT!" .
    if errorlevel 1 goto fail
  )
)
echo.
echo  [成功] 全部产物已输出到：%~dp0dist
dir /b dist
echo.
pause
exit /b 0

:fail
echo.
echo  [失败] 编译未通过，请检查上面的报错信息。
echo         如果提示找不到 go 命令，请先安装 Go 1.21+ 并加入 PATH。
echo.
pause
exit /b 1
