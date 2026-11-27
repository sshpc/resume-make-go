//go:build windows

package main

import "syscall"

// initConsole 把 Windows 控制台代码页切到 UTF-8（65001），
// 否则双击运行时中文横幅和日志会是乱码。
func initConsole() {
	kernel32 := syscall.NewLazyDLL("kernel32.dll")
	if p := kernel32.NewProc("SetConsoleOutputCP"); p.Find() == nil {
		_, _, _ = p.Call(uintptr(65001))
	}
	if p := kernel32.NewProc("SetConsoleCP"); p.Find() == nil {
		_, _, _ = p.Call(uintptr(65001))
	}
}
