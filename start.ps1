# AI 热门开源项目聚合平台 - 启动脚本
Write-Host "`n  AI Trending Platform - Starting...`n" -ForegroundColor Cyan

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Node.js not found!" -ForegroundColor Red
    exit 1
}

# Install dependencies if needed
if (-not (Test-Path "server\node_modules")) {
    Write-Host "`n  Installing server dependencies..." -ForegroundColor Yellow
    Push-Location server; npm install; Pop-Location
}
if (-not (Test-Path "client\node_modules")) {
    Write-Host "`n  Installing client dependencies..." -ForegroundColor Yellow
    Push-Location client; npm install; Pop-Location
}

# Start backend
Write-Host "`n  Starting backend (port 3001)..." -ForegroundColor Green
$backend = Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$PSScriptRoot\server'; npm run dev`"" -PassThru

# Wait for backend
Start-Sleep -Seconds 3

# Start frontend
Write-Host "  Starting frontend (port 5173)..." -ForegroundColor Green
$frontend = Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$PSScriptRoot\client'; npm run dev`"" -PassThru

Write-Host "`n  All services started!" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "`n  Press Ctrl+C in each window to stop.`n" -ForegroundColor DarkGray
