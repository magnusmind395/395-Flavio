# Deploy Magnus Mind — rode na raiz do projeto: .\scripts\deploy.ps1
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

Write-Host "=== 1. Git push (magnusmind395) ===" -ForegroundColor Cyan
git push magnus main
if ($LASTEXITCODE -ne 0) { Write-Warning "Push magnus falhou — verifique acesso ao repo magnusmind395/395-Flavio" }

Write-Host "`n=== 2. Build frontend (Netlify) ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build frontend falhou" }

Write-Host "`n=== 3. Netlify deploy (precisa: netlify login) ===" -ForegroundColor Cyan
$npx = Get-Command npx -ErrorAction SilentlyContinue
if (-not $npx) { throw "npx nao encontrado" }
npx --yes netlify-cli deploy --prod --dir=dist
if ($LASTEXITCODE -ne 0) {
  Write-Host @"

Netlify CLI nao autenticado. Rode UMA vez no terminal:
  npx netlify-cli login
  npx netlify-cli link
Depois execute de novo: .\scripts\deploy.ps1

"@ -ForegroundColor Yellow
}

Write-Host "`n=== Render ===" -ForegroundColor Cyan
Write-Host @"
1. Abra scripts\render.env — preencha OPENROUTER_API_KEY
2. Render → Environment → Add from .env → cole o arquivo
3. Build Command: npm install --include=dev && npm run build
4. Start Command: npm start | Root: server
5. Manual Deploy

Render NAO aceita login pelo PC sem API key em https://dashboard.render.com/u/settings#api-keys
"@ -ForegroundColor Yellow

Write-Host "`nArquivo pronto: $Root\scripts\render.env" -ForegroundColor Green
