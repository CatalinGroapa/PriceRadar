$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverDir = Join-Path $projectRoot 'server'

if (-not (Test-Path (Join-Path $serverDir 'package.json'))) {
    Write-Error "Nu am gasit server/package.json in: $serverDir"
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js nu este instalat sau nu e in PATH."
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm nu este instalat sau nu e in PATH."
}

Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    "cd `"$serverDir`"; npm start"
)

Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    "cd `"$projectRoot`"; node web-static-server.js"
)

Write-Host "Serverele au fost pornite."
Write-Host "Backend:  http://localhost:3000/health"
Write-Host "Frontend: http://localhost:8080"
