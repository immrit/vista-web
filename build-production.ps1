# Vista Web Production Build Script for Windows

Write-Host "🧹 Cleaning previous build..." -ForegroundColor Green
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
if (Test-Path "package-lock.json") { Remove-Item -Force "package-lock.json" }

Write-Host "📦 Installing dependencies..." -ForegroundColor Green
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed!" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Building for production..." -ForegroundColor Green
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
    Write-Host "🚀 Starting production server..." -ForegroundColor Yellow
    npm start
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
} 