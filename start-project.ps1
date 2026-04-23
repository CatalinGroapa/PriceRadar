$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$serverPath = Join-Path $root "server"
$clientPath = Join-Path $root "client"

if (-not (Test-Path $serverPath)) {
    Write-Error "Folderul server nu a fost gasit: $serverPath"
    exit 1
}

if (-not (Test-Path $clientPath)) {
    Write-Error "Folderul client nu a fost gasit: $clientPath"
    exit 1
}

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command",
    "cd `"$serverPath`"; npm install; npm run dev"
)

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command",
    "cd `"$clientPath`"; npm install; npm run dev"
)

Write-Host "Backend si frontend pornesc in ferestre separate."
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend:  http://localhost:3000"
