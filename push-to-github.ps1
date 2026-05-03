# Push branch main to GitHub.
#
# Token (choose one):
#   A) Environment: set GITHUB_TOKEN=...  (cmd) or $env:GITHUB_TOKEN='...' (PowerShell)
#   B) File: create .git-push-token in this folder with ONE line = your PAT only (no quotes).
#      That file is in .gitignore and will not be committed.

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $repoRoot

if (-not (Test-Path -LiteralPath (Join-Path $repoRoot '.git'))) {
  Write-Error "Not a git repository: $repoRoot"
  exit 1
}

$token = $env:GITHUB_TOKEN
if (-not $token) {
  $tokenFile = Join-Path $repoRoot '.git-push-token'
  if (Test-Path -LiteralPath $tokenFile) {
    $token = (Get-Content -LiteralPath $tokenFile -Raw -Encoding UTF8).Trim()
  }
}

if (-not $token -or $token.Length -lt 10) {
  Write-Host 'No token. Either:' -ForegroundColor Yellow
  Write-Host '  1) Create file .git-push-token here with your PAT on one line, or' -ForegroundColor Cyan
  Write-Host '  2) set GITHUB_TOKEN=... then run this script again.' -ForegroundColor Cyan
  exit 1
}

$gitCmd = (Get-Command git -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source)
if (-not $gitCmd) {
  foreach ($p in @('C:\Program Files\Git\cmd\git.exe', 'C:\Program Files\Git\bin\git.exe')) {
    if (Test-Path -LiteralPath $p) { $gitCmd = $p; break }
  }
}
if (-not $gitCmd) {
  Write-Error 'Git not found. Install Git for Windows or add git to PATH.'
  exit 1
}

$user = 'zivmarad'
$repo = 'quote-builder'
$remote = "https://${user}:$token@github.com/${user}/${repo}.git"

& $gitCmd remote set-url origin $remote
try {
  & $gitCmd push -u origin main
} finally {
  & $gitCmd remote set-url origin "https://github.com/${user}/${repo}.git"
  Write-Host 'Remote reset to clean URL (no token in .git/config).' -ForegroundColor Green
}
