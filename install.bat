@echo off
chcp 65001 >nul
echo ========================================
echo    Paper Reader AI - 安装脚本
echo ========================================
echo.

REM 安装后端依赖
echo [1/2] 安装后端 Python 依赖...
cd backend
pip install -r requirements.txt
if errorlevel 1 (
    echo [错误] 后端依赖安装失败
    pause
    exit /b 1
)
echo [OK] 后端依赖安装完成
cd ..

REM 安装前端依赖
echo [2/2] 安装前端 Node.js 依赖...
cd frontend
call npm install
if errorlevel 1 (
    echo [错误] 前端依赖安装失败
    pause
    exit /b 1
)
echo [OK] 前端依赖安装完成
cd ..

echo.
echo ========================================
echo    安装完成！
echo ========================================
echo.
echo 下一步:
echo 1. 编辑 backend\.env 文件，填入你的大模型 API Key
echo 2. 运行 start.bat 启动应用
echo.
pause
