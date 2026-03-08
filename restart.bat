@echo off
chcp 65001 >nul
echo ========================================
echo    Paper Reader AI - 重启服务
echo ========================================
echo.

REM 清理占用的端口
echo [1/3] 清理占用端口...
powershell -Command "Get-NetTCPConnection -LocalPort 5173,5174,5175,8080 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" 2>nul
timeout /t 2 /nobreak >nul

REM 启动后端
echo [2/3] 启动后端服务...
start "Paper Reader - Backend" cmd /k "cd /d %~dp0backend && python main.py"
timeout /t 3 /nobreak >nul

REM 启动前端
echo [3/3] 启动前端服务...
start "Paper Reader - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo    服务启动完成！
echo ========================================
echo.
echo 前端地址：http://localhost:5173
echo 后端地址：http://127.0.0.1:8080
echo.
echo 按任意键退出...
pause >nul
