$ErrorActionPreference = 'Stop'

# Ensure we're operating from the repository working tree
Set-Location 'C:\job-portal\backend'

$ts = Get-Date -Format yyyyMMddHHmmss
$backup = "local-backup-$ts"
Write-Host "Creating backup branch $backup"
git checkout -b $backup

Write-Host "Fetching origin"
git fetch origin

Write-Host "Checking out main"
git checkout main

Write-Host "Resetting main to origin/main (hard)"
git reset --hard origin/main

Write-Host "Finding passport.js commit on $backup"
$commit = (git log $backup -n 1 --format=%H -- src/config/passport.js).Trim()
if (-not $commit) {
    Write-Host "No commit found for passport.js on backup branch"
    exit 1
}

Write-Host "Attempting to restore src/config/passport.js from $backup"
git checkout $backup -- src/config/passport.js

$status = git status --porcelain
if ($status -match 'src/config/passport.js') {
    Write-Host "Staging and committing restored passport.js"
    git add src/config/passport.js
    git commit -m "fix(auth): accept OAUTH_GITHUB_CLIENT_SECRET fallback"
    Write-Host "Pushing main to origin..."
    git push origin main
    Write-Host "Reconciliation complete."
} else {
    Write-Host "No changes to passport.js (already in sync with origin/main). Nothing to commit."
}
