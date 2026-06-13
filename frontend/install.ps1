# install.ps1 — Single-command setup for Windows (PowerShell)
Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
$packages = Get-Content requirements.txt | Where-Object { $_.Trim() -ne "" }
npm install @($packages)
Write-Host "Done. Run 'npm run dev' to start the development server." -ForegroundColor Green
