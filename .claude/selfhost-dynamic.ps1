$ErrorActionPreference = 'Stop'
$root = 'C:\Users\vv\Desktop\Monalisa-Flores-Site'
$imgDir = Join-Path $root 'img'
$file = Join-Path $root 'extra-products.js'
$txt = Get-Content -Raw -LiteralPath $file

$GF_BASE = 'https://static.giulianaflores.com.br/images/product/'
$SHOP_BASE = 'https://cdn.shopify.com/s/files/1/0707/9811/5111/files/'

# Collect (expression -> resolvedUrl)
$pairs = @{}
foreach ($m in [regex]::Matches($txt, 'gf\("(\d+)"\)')) {
  $pairs[$m.Value] = "$GF_BASE$($m.Groups[1].Value)gg.jpg?ims=300x300"
}
foreach ($m in [regex]::Matches($txt, "BASE\s*\+\s*'([^']+)'")) {
  $pairs[$m.Value] = "$SHOP_BASE$($m.Groups[1].Value)"
}
Write-Host "Expressoes dinamicas unicas: $($pairs.Count)"

$md5 = [System.Security.Cryptography.MD5]::Create()
$map = @{}   # expression -> local path
$ok = 0; $fail = 0; $skip = 0
$failList = New-Object System.Collections.Generic.List[string]
foreach ($kv in $pairs.GetEnumerator()) {
  $expr = $kv.Key; $u = $kv.Value
  $hashBytes = $md5.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($u))
  $hash = (-join ($hashBytes | ForEach-Object { $_.ToString('x2') })).Substring(0,16)
  $pathOnly = ($u -split '\?')[0]
  $ext = [System.IO.Path]::GetExtension($pathOnly).ToLower()
  if ($ext -notmatch '^\.(jpg|jpeg|png|webp|avif|gif)$') { $ext = '.jpg' }
  $fname = "$hash$ext"
  $dest = Join-Path $imgDir $fname
  $local = "img/$fname"
  if ((Test-Path $dest) -and ((Get-Item $dest).Length -gt 0)) { $map[$expr] = $local; $skip++; continue }
  try {
    $host0 = ([System.Uri]$u).GetLeftPart([System.UriPartial]::Authority)
    Invoke-WebRequest -Uri $u -OutFile $dest -MaximumRedirection 5 -TimeoutSec 25 `
      -Headers @{ 'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'; 'Referer'=$host0; 'Accept'='image/avif,image/webp,image/*,*/*' } | Out-Null
    if ((Get-Item $dest).Length -gt 0) { $map[$expr] = $local; $ok++ } else { Remove-Item $dest -Force; $fail++; $failList.Add("$expr -> $u") }
  } catch {
    $fail++; $failList.Add("$expr -> $u")
    if (Test-Path $dest) { Remove-Item $dest -Force }
  }
}
Write-Host "Baixadas: $ok | Ja existiam: $skip | Falhas: $fail"

# Replace expressions with quoted local path
foreach ($kv in $map.GetEnumerator()) { $txt = $txt.Replace($kv.Key, '"' + $kv.Value + '"') }
Set-Content -LiteralPath $file -Value $txt -Encoding UTF8 -NoNewline
Write-Host "extra-products.js reescrito."

$failList | Add-Content -LiteralPath (Join-Path $imgDir '_falhas.txt') -Encoding UTF8
Write-Host "DONE ok=$ok skip=$skip fail=$fail"
