# Quick Start Script for RVC Voice Cloning
# Run this script to set up everything automatically

Write-Host "🎤 RVC Voice Cloning Setup" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check Python installation
Write-Host "1. Checking Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Python found: $pythonVersion" -ForegroundColor Green
    
    # Check version is 3.9-3.11
    if ($pythonVersion -match "Python 3\.(9|10|11)") {
        Write-Host "   ✅ Python version is compatible" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Warning: RVC requires Python 3.9-3.11" -ForegroundColor Yellow
        Write-Host "   Your version: $pythonVersion" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ Python not found!" -ForegroundColor Red
    Write-Host "   Please install Python 3.11 from https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}

# Check Node.js
Write-Host "`n2. Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ Node.js not found!" -ForegroundColor Red
    exit 1
}

# Check FFmpeg
Write-Host "`n3. Checking FFmpeg..." -ForegroundColor Yellow
$ffmpegVersion = ffmpeg -version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ FFmpeg found" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  FFmpeg not found" -ForegroundColor Yellow
    Write-Host "   Install with: choco install ffmpeg" -ForegroundColor Yellow
    Write-Host "   Or download from: https://ffmpeg.org/download.html" -ForegroundColor Yellow
}

# Create virtual environment
Write-Host "`n4. Setting up Python virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Write-Host "   ✅ Virtual environment already exists" -ForegroundColor Green
} else {
    Write-Host "   Creating virtual environment..." -ForegroundColor Gray
    python -m venv venv
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Virtual environment created" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed to create virtual environment" -ForegroundColor Red
        exit 1
    }
}

# Activate virtual environment
Write-Host "`n5. Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"
Write-Host "   ✅ Virtual environment activated" -ForegroundColor Green

# Upgrade pip
Write-Host "`n6. Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip --quiet
Write-Host "   ✅ Pip upgraded" -ForegroundColor Green

# Install Python dependencies
Write-Host "`n7. Installing Python dependencies..." -ForegroundColor Yellow
Write-Host "   This may take 5-10 minutes..." -ForegroundColor Gray

if (Test-Path "requirements.txt") {
    pip install -r requirements.txt --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Python dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Some dependencies may have failed" -ForegroundColor Yellow
        Write-Host "   The service will run in mock mode" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  requirements.txt not found" -ForegroundColor Yellow
}

# Install Node.js dependencies
Write-Host "`n8. Installing Node.js dependencies..." -ForegroundColor Yellow
npm install form-data axios --silent
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Node.js dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed to install Node.js dependencies" -ForegroundColor Red
}

# Create RVC directories
Write-Host "`n9. Creating RVC directories..." -ForegroundColor Yellow
$dirs = @("rvc", "rvc\models", "rvc\weights", "rvc\logs", "rvc\temp")
foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}
Write-Host "   ✅ RVC directories created" -ForegroundColor Green

# Summary
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start RVC service:" -ForegroundColor White
Write-Host "   python rvc_service.py`n" -ForegroundColor Gray

Write-Host "2. In a new terminal, start Node.js server:" -ForegroundColor White
Write-Host "   node server.js`n" -ForegroundColor Gray

Write-Host "3. Open browser:" -ForegroundColor White
Write-Host "   http://localhost:3000/dashboard.html`n" -ForegroundColor Gray

Write-Host "4. Go to Voice Cloning tab and upload your voice`n" -ForegroundColor White

Write-Host "📖 For detailed instructions, see: RVC_SETUP_GUIDE.md`n" -ForegroundColor Cyan

# Ask if user wants to start services
$response = Read-Host "Start services now? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host "`nStarting services..." -ForegroundColor Yellow
    
    # Start RVC service in new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\venv\Scripts\Activate.ps1; python rvc_service.py"
    
    # Wait a moment
    Start-Sleep -Seconds 2
    
    # Start Node.js server in new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; node server.js"
    
    # Wait a moment
    Start-Sleep -Seconds 3
    
    # Open browser
    Start-Process "http://localhost:3000/dashboard.html"
    
    Write-Host "✅ Services started!" -ForegroundColor Green
    Write-Host "   RVC Service: http://localhost:5000" -ForegroundColor Gray
    Write-Host "   Node.js Server: http://localhost:3000" -ForegroundColor Gray
    Write-Host "   Dashboard: http://localhost:3000/dashboard.html" -ForegroundColor Gray
}
