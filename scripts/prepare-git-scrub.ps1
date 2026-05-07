<#
prepare-git-scrub.ps1

Usage: run from a safe machine. This script prepares commands to:
- mirror-clone the repo (HTTPS). Use a PAT or credential manager for auth.
- install git-filter-repo (Python) and run it to remove sensitive files from history.

IMPORTANT: This rewrites history. Coordinate with your team before force-pushing.
#>

Param(
    [string]$Owner = "<GITHUB_OWNER>",
    [string]$Repo = "<REPO>",
    [string]$Pat = $env:GITHUB_PAT
)

if ($Owner -like "<*>") {
    Write-Host "Please edit the script and set `Owner` and `Repo` parameters, or pass them as args." -ForegroundColor Yellow
    exit 1
}

$mirrorDir = "$pwd\$Repo.git"

Write-Host "1) Ensure python & pip are installed and git-filter-repo is available"
Write-Host "   Install: python -m pip install --upgrade pip; python -m pip install git-filter-repo"

Write-Host "2) Mirror-clone the repository (HTTPS). Using PAT if provided to avoid SSH issues:"
if ($Pat) {
    Write-Host "   git clone --mirror https://$Pat@github.com/$Owner/$Repo.git $mirrorDir"
} else {
    Write-Host "   git clone --mirror https://github.com/$Owner/$Repo.git $mirrorDir"
}

Write-Host "3) Run git-filter-repo to remove the sensitive paths from history"
Write-Host "   cd $mirrorDir"
Write-Host "   git filter-repo --invert-paths --paths .env --paths .mcp.json --paths .venv --paths '*.pem' --paths '*.key'"

Write-Host "4) Force-push the cleaned history back to origin"
Write-Host "   git push --force --all"
Write-Host "   git push --force --tags"

Write-Host "5) After force-push, ask all collaborators to reclone the repo or reset their clones:" -ForegroundColor Cyan
Write-Host "   git fetch origin && git reset --hard origin/main"

Write-Host "ALTERNATIVE: Use BFG (if you prefer). Download bfg.jar and run:" -ForegroundColor Cyan
Write-Host "   java -jar bfg.jar --delete-files .env --delete-files .mcp.json --delete-files '*.key' REPO.git"
Write-Host "   cd REPO.git"
Write-Host "   git reflog expire --expire=now --all && git gc --prune=now --aggressive"
Write-Host "   git push --force --all"

Write-Host "SCRIPT READY: review the printed commands, run them manually after coordination."
