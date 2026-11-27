@echo off
REM ============================================================
REM  ResumeMaker / 简历工坊  -  一键编译脚本
REM  产物：简历工坊.exe（单个文件，前端已内嵌，无需其它文件）
REM ============================================================
setlocal

cd /d "%~dp0"

echo.
echo  正在编译 简历工坊.exe ...
echo.

REM 把 Go 的缓存放到当前目录的子文件夹里，避免受系统临时目录权限影响。
set "GOCACHE=%~dp0.gocache"
set "GOTMPDIR=%~dp0.gotmp"

go build -trimpath -ldflags "-s -w" -o "简历工坊.exe" .
if errorlevel 1 (
  echo.
  echo  [失败] 编译未通过，请检查上面的报错信息。
  echo         如果提示找不到 go 命令，请先安装 Go 1.21+ 并加入 PATH。
  echo.
  pause
  exit /b 1
)

echo.
echo  [成功] 已生成：%~dp0简历工坊.exe
for %%A in ("简历工坊.exe") do echo         文件大小：%%~zA 字节
echo.
echo  双击它即可使用（会自动打开浏览器）。
echo.
pause
