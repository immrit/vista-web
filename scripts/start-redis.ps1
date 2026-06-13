#Requires -Version 5.1
# Starts Redis for local Vista dev (uses vista-backend docker-compose).

$ErrorActionPreference = 'Stop'
$BackendRoot = if ($env:VISTA_BACKEND_PATH) { $env:VISTA_BACKEND_PATH } else { Join-Path (Split-Path $PSScriptRoot -Parent) '..\vista-backend' }
$BackendRoot = (Resolve-Path $BackendRoot).Path

Write-Host "Starting Redis from $BackendRoot ..."
Push-Location $BackendRoot
try {
  docker compose up -d redis
  docker compose ps redis
  Write-Host "Redis should be available at redis://localhost:6379"
} finally {
  Pop-Location
}
