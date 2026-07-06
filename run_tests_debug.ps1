# Free ports 3000 and 3001
$conns = Get-NetTCPConnection -LocalPort 3000, 3001 -ErrorAction SilentlyContinue
if ($conns) {
    Write-Host "Killing processes on ports 3000/3001..."
    foreach ($c in $conns) {
        if ($c.OwningProcess -gt 0) {
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 2
}

# Start backend
Write-Host "Starting mock backend..."
$backend = Start-Process -FilePath "pnpm.cmd" -ArgumentList "mock-backend" -PassThru -NoNewWindow

# Start serve
Write-Host "Starting serve..."
$serve = Start-Process -FilePath "pnpm.cmd" -ArgumentList "serve" -PassThru -NoNewWindow

Write-Host "Waiting 4 seconds for servers to start..."
Start-Sleep -Seconds 4

# Run Playwright
Write-Host "Running Playwright test..."
npx playwright test tests/e2e/broono.spec.ts -g "35. Pet: Insufficient coins for Water"

# Stop processes
Write-Host "Cleaning up background servers..."
if ($backend) { Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue }
if ($serve) { Stop-Process -Id $serve.Id -Force -ErrorAction SilentlyContinue }
Write-Host "Done."
