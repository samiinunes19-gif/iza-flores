$ErrorActionPreference = 'Stop'
$root = 'C:\Users\vv\Desktop\Monalisa-Flores-Site'
$imgDir = Join-Path $root 'img'
if (-not (Test-Path $imgDir)) { New-Item -ItemType Directory -Path $imgDir | Out-Null }

$files = @('products-data.js','extra-products.js','script.js','cart.js') | ForEach-Object { Join-Path $root $_ }

# 1) Collect every image-extension URL across the JS files
$rx = [regex]'https?://[^"''\s)]+?\.(?:jpg|jpeg|png|webp|avif|gif)(?:\?[^"''\s)]*)?'
$urls = @{}
foreach ($f in $files) {
  $txt = Get-Content -Raw -LiteralPath $f
  foreach ($m in $rx.Matches($txt)) { $urls[$m.Value] = $true }
}
$list = @($urls.Keys)
Write-Host "URLs unicas: $($list.Count)"

# 2) Download each to img\<hash>.<ext>, build url->local map
$md5 = [System.Security.Cryptography.MD5]::Create()
$map = @{}
$ok = 0; $fail = 0; $skip = 0
$failList = New-Object System.Collections.Generic.List[string]
foreach ($u in $list) {
  $hashBytes = $md5.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($u))
  $hash = -join ($hashBytes | ForEach-Object { $_.ToString('x2') })
  $hash = $hash.Substring(0,16)
  $pathOnly = ($u -split '\?')[0]
  $ext = [System.IO.Path]::GetExtension($pathOnly).ToLower()
  if ($ext -notmatch '^\.(jpg|jpeg|png|webp|avif|gif)$') { $ext = '.jpg' }
  $fname = "$hash$ext"
  $dest = Join-Path $imgDir $fname
  $local = "img/$fname"
  $map[$u] = $local
  if ((Test-Path $dest) -and ((Get-Item $dest).Length -gt 0)) { $skip++; continue }
  try {
    $host0 = ([System.Uri]$u).GetLeftPart([System.UriPartial]::Authority)
    Invoke-WebRequest -Uri $u -OutFile $dest -MaximumRedirection 5 -TimeoutSec 25 `
      -Headers @{ 'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'; 'Referer'=$host0; 'Accept'='image/avif,image/webp,image/*,*/*' } | Out-Null
    if ((Get-Item $dest).Length -gt 0) { $ok++ } else { Remove-Item $dest -Force; $fail++; $failList.Add($u); $map.Remove($u) }
  } catch {
    $fail++; $failList.Add($u); $map.Remove($u)
    if (Test-Path $dest) { Remove-Item $dest -Force }
  }
}
Write-Host "Baixadas: $ok  | Ja existiam: $skip  | Falhas: $fail"

# 3) Rewrite the JS files, replacing only successfully-hosted URLs
foreach ($f in $files) {
  $txt = Get-Content -Raw -LiteralPath $f
  foreach ($kv in $map.GetEnumerator()) { $txt = $txt.Replace($kv.Key, $kv.Value) }
  Set-Content -LiteralPath $f -Value $txt -Encoding UTF8 -NoNewline
}
Write-Host "Arquivos reescritos."

# 4) Save manifest + failures
($map.GetEnumerator() | ForEach-Object { "$($_.Key)`t$($_.Value)" }) | Set-Content -LiteralPath (Join-Path $imgDir '_manifest.tsv') -Encoding UTF8
$failList | Set-Content -LiteralPath (Join-Path $imgDir '_falhas.txt') -Encoding UTF8
Write-Host "DONE ok=$ok skip=$skip fail=$fail total=$($list.Count)"
