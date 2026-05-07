param(
    [string]$Repo = ""
)

function Get-RepoSlugFromOrigin() {
    $url = git remote get-url origin 2>$null
    if (-not $url) { return $null }
    # strip .git
    $u = $url -replace '\.git$',''
    if ($u -match 'github.com[:/](.+)$') { return $matches[1] }
    return $null
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Error "gh CLI not found. Install GitHub CLI and run 'gh auth login' before running this script."
    exit 1
}

if (-not $Repo) {
    $Repo = Get-RepoSlugFromOrigin
}

if (-not $Repo) {
    Write-Error "Could not determine repository slug. Provide -Repo 'owner/repo'."
    exit 1
}

Write-Host "Using repo: $Repo"

if (-not (Test-Path ".env.new")) {
    Write-Error ".env.new not found in repository root. Run scripts/generate_env_new.py first and review the file." 
    exit 1
}

$allowed = @(
    'DATABASE_URL', 'NEON_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'OAUTH_GITHUB_CLIENT_SECRET', 'LINKEDIN_CLIENT_SECRET',
    'JWT_SECRET', 'JWT_REFRESH_SECRET', 'SESSION_SECRET', 'ENCRYPTION_KEY', 'LOGO_DEV_TOKEN', 'DB_PASSWORD'
)

Get-Content .env.new | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) { continue }
    if ($line -notmatch "=") { continue }
    $parts = $line -split "=",2
    $name = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"')
    # map legacy name to allowed GitHub Actions secret name (GitHub rejects names starting with GITHUB_)
    if ($name -eq 'GITHUB_CLIENT_SECRET') { Write-Host "Mapping GITHUB_CLIENT_SECRET -> OAUTH_GITHUB_CLIENT_SECRET"; $name = 'OAUTH_GITHUB_CLIENT_SECRET' }
    if ($allowed -contains $name) {
        Write-Host "Setting secret: $name"
        gh secret set $name --body $value --repo $Repo
    } else {
        Write-Host "Skipping: $name"
    }
}

Write-Host "Done. Secrets pushed to $Repo (if gh authenticated and you have permission)."