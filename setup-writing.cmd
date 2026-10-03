@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
title Mind - 写作环境准备
if /i "%~1"=="--check" goto check
echo 正在准备博客写作环境。安装程序可能请求系统授权或许可确认。
echo 本脚本不会提交或发布文章，也不会设置你的 Git 身份。
echo.
call :refreshpath
where git.exe >nul 2>nul
if errorlevel 1 (
  call :install Git.Git
  if errorlevel 1 goto failed
)
call :refreshpath
where node.exe >nul 2>nul
if errorlevel 1 (
  call :install OpenJS.NodeJS.LTS
  if errorlevel 1 goto failed
)
call :refreshpath
node -e "if(Number(process.versions.node.split('.')[0])<24)process.exit(1)"
if errorlevel 1 (
  echo 当前 Node.js 低于 24。请先安装 Node.js 24 LTS，再重新运行。
  echo https://nodejs.org/en/download
  goto failed
)
where code.cmd >nul 2>nul
if errorlevel 1 (
  call :install Microsoft.VisualStudioCode
  if errorlevel 1 goto failed
)
call :refreshpath
where git.exe >nul 2>nul
if errorlevel 1 goto restart
where npm.cmd >nul 2>nul
if errorlevel 1 goto restart
where code.cmd >nul 2>nul
if errorlevel 1 goto restart

set "MIND_WRITING_DIR=%USERPROFILE%\Projects\mind"
if exist "%~dp0.git" set "MIND_WRITING_DIR=%~dp0"
if not exist "%MIND_WRITING_DIR%" (
  git clone https://github.com/ma1203580780/mind.git "%MIND_WRITING_DIR%"
  if errorlevel 1 goto failed
)
if not exist "%MIND_WRITING_DIR%\.git" (
  echo 目标目录已存在但不是 Git 仓库，请保留现有文件并检查：
  echo "%MIND_WRITING_DIR%"
  goto failed
)
cd /d "%MIND_WRITING_DIR%"
git remote get-url origin | findstr /x /c:"https://github.com/ma1203580780/mind.git" /c:"https://github.com/ma1203580780/mind" /c:"git@github.com:ma1203580780/mind.git" >nul
if errorlevel 1 (
  echo 当前目录的 origin 不是目标博客仓库，已停止。
  goto failed
)
git status --porcelain | findstr . >nul
if not errorlevel 1 goto localchanges
git pull --ff-only
if errorlevel 1 goto failed
goto dependencies
:localchanges
echo 检测到未提交内容，保留你的修改，跳过自动拉取。
:dependencies
call npm.cmd ci
if errorlevel 1 goto failed
call code.cmd --install-extension eliostruyf.vscode-front-matter
if errorlevel 1 goto failed
call code.cmd --install-extension astro-build.astro-vscode
if errorlevel 1 goto failed
node scripts/init-writing.mjs
if errorlevel 1 goto failed
call npm.cmd run build
if errorlevel 1 goto failed
call code.cmd --new-window "%MIND_WRITING_DIR%\mind-writing.code-workspace" "%MIND_WRITING_DIR%\src\content\posts\my-first-post.md"
if errorlevel 1 goto failed
echo.
echo 准备完成，VS Code 已打开文章。请按提示确认工作区信任。
echo 即将启动本地预览，请保持这个窗口开启。
echo 草稿地址：http://127.0.0.1:4321/mind/posts/my-first-post/
echo 写完后关闭草稿开关、提交并同步。首次推送需你在浏览器登录 GitHub。
echo.
call npm.cmd run write
pause
exit /b 0

:refreshpath
set "PATH=%PATH%;%ProgramFiles%\Git\cmd;%LOCALAPPDATA%\Programs\Git\cmd;%ProgramFiles%\nodejs;%LOCALAPPDATA%\Programs\Microsoft VS Code\bin;%ProgramFiles%\Microsoft VS Code\bin"
exit /b 0
:install
where winget.exe >nul 2>nul
if errorlevel 1 (
  echo 没有找到 WinGet，请在 Microsoft Store 更新“应用安装程序”，然后重试。
  echo 或按 docs/WRITING_WINDOWS.md 手动安装工具。
  exit /b 1
)
winget install --exact --id %1 --source winget
exit /b %errorlevel%
:check
call :refreshpath
where git.exe >nul 2>nul
if errorlevel 1 exit /b 1
where npm.cmd >nul 2>nul
if errorlevel 1 exit /b 1
node -e "if(Number(process.versions.node.split('.')[0])<24)process.exit(1)"
exit /b %errorlevel%
:restart
echo 工具已安装但尚未进入 PATH。请关闭此窗口，再双击运行本脚本。
pause
exit /b 1
:failed
echo.
echo 准备未完成，请把上方错误信息发给我。现有文章不会被覆盖。
pause
exit /b 1
