//go:build !windows

package main

// initConsole 在非 Windows 平台上无需处理控制台代码页。
func initConsole() {}
