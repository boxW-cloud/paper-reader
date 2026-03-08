@echo off
chcp 65001 >nul
echo ========================================
echo    Paper Reader AI - 启动脚本
echo ========================================
echo.

REM 检查 Python
echo [1/4] 检查 Python 环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Python 环境，请先安装 Python 3.9+
    pause
    exit /b 1
)
echo [OK] Python 环境正常

REM 检查 Node.js
echo [2/4] 检查 Node.js 环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js 环境，请先安装 Node.js 18+
    pause
    exit /b 1
)
echo [OK] Node.js 环境正常

REM 启动后端
echo [3/4] 启动后端服务...
start "Paper Reader - Backend" cmd /k "cd backend && echo 正在启动后端服务... && python main.py"
echo [OK] 后端服务已启动 (http://localhost:8000)

REM 等待后端启动
timeout /t 3 /nobreak >nul

REM 启动前端
echo [4/4] 启动前端服务...
start "Paper Reader - Frontend" cmd /k "cd frontend && echo 正在启动前端服务... && npm run dev"
echo [OK] 前端服务已启动 (http://localhost:5173)

echo.
echo ========================================
echo    启动完成！
echo ========================================
echo.
echo - 后端 API: http://localhost:8000
echo - 前端界面：http://localhost:5173
echo - API 文档：http://localhost:8000/docs
echo.
echo 按任意键退出此窗口...
pause >nul
