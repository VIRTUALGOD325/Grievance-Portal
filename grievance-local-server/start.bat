@echo off
echo.
echo 🤖 Starting Grievance Processing Local Server...
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo Error: Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo Error: Failed to activate virtual environment
    pause
    exit /b 1
)

REM Install/upgrade dependencies
echo Installing dependencies...
python -m pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
if errorlevel 1 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ✅ Setup complete!
echo.
echo 🚀 Starting server on http://localhost:5002
echo.
echo Note: First run will download models (~8-16GB total)
echo This may take 10-30 minutes depending on your internet speed
echo.
echo IMPORTANT: You need to login to Hugging Face first:
echo Run: huggingface-cli login
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
python server.py
