@echo off
setlocal
cd /d "%~dp0"

where javac >nul 2>nul
if errorlevel 1 (
	echo A Java Development Kit is required. Install a JDK, then run this file again.
	pause
	exit /b 1
)

javac WatchStoreServer.java
if errorlevel 1 (
	echo Could not compile WatchStoreServer.java.
	pause
	exit /b 1
)

java WatchStoreServer
pause