$ErrorActionPreference = 'Stop'
$root = 'C:\Users\vv\Desktop\Monalisa-Flores-Site'
$imgDir = Join-Path $root 'img'
$utf8 = New-Object System.Text.UTF8Encoding($false)   # no BOM

# 1) Restore clean UTF-8 originals from git
Push-Location $root
& git checkout -- products-data.js extra-products.js script.js cart.js
Pop-Location
Write-Host "Originais restaurados do git."

# 2) Static URL -> local map from manifest
$map = @{}
foreach ($line in [System.IO.File]::ReadAllLines((Join-Path $imgDir '_manifest.tsv'), $utf8)) {
  if (-not $line) { continue }
  $p = $line -split "`t", 2
  if ($p.Count -eq 2) { $map[$p[0]] = $p[1] }
}
Write-Host "Manifest estatico: $($map.Count) URLs"

# 3) Dynamic expression -> local map (recompute hashes, images already on disk)
$GF_BASE = 'https://static.giulianaflores.com.br/images/product/'
$SHOP_BASE = 'https://cdn.shopify.com/s/files/1/0707/9811/5111/files/'
$md5 = [System.Security.Cryptography.MD5]::Create()
function LocalFor($u) {
  $h = (-join (([System.Security.Cryptography.MD5]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes($u))) | ForEach-Object { $_.ToString('x2') })).Substring(0,16)
  $pathOnly = ($u -split '\?')[0]
  $ext = [System.IO.Path]::GetExtension($pathOnly).ToLower()
  if ($ext -notmatch '^\.(jpg|jpeg|png|webp|avif|gif)$') { $ext = '.jpg' }
  return "img/$h$ext"
}
$exprMap = @{}
$extra = [System.IO.File]::ReadAllText((Join-Path $root 'extra-products.js'), $utf8)
foreach ($m in [regex]::Matches($extra, 'gf\("(\d+)"\)')) {
  $u = "$GF_BASE$($m.Groups[1].Value)gg.jpg?ims=300x300"
  $local = LocalFor $u
  if (Test-Path (Join-Path $root $local)) { $exprMap[$m.Value] = $local }
}
foreach ($m in [regex]::Matches($extra, "BASE\s*\+\s*'([^']+)'")) {
  $u = "$SHOP_BASE$($m.Groups[1].Value)"
  $local = LocalFor $u
  if (Test-Path (Join-Path $root $local)) { $exprMap[$m.Value] = $local }
}
Write-Host "Expressoes dinamicas: $($exprMap.Count)"

# 4) Rewrite each file with correct UTF-8
$files = @('products-data.js','extra-products.js','script.js','cart.js')
foreach ($fn in $files) {
  $f = Join-Path $root $fn
  $txt = [System.IO.File]::ReadAllText($f, $utf8)
  foreach ($kv in $map.GetEnumerator())     { $txt = $txt.Replace($kv.Key, $kv.Value) }
  if ($fn -eq 'extra-products.js') {
    foreach ($kv in $exprMap.GetEnumerator()) { $txt = $txt.Replace($kv.Key, '"' + $kv.Value + '"') }
  }
  [System.IO.File]::WriteAllText($f, $txt, $utf8)
  Write-Host "  reescrito: $fn"
}
Write-Host "DONE"
