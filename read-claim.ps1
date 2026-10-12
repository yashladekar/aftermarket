$ErrorActionPreference = "Stop"
$p = "C:\Users\yll929755\Desktop\aftermarket\apps\web\app\(app)\claims\[lineId]\page.tsx"
$t = Get-Content $p -Raw
Write-Output "LINES: $($t.Split([Environment]::NewLine).Count)"
Write-Output "CHARS: $($t.Length)"
Write-Output "---- FIRST 4000 CHARS ----"
Write-Output $t.Substring(0, [Math]::Min(4000, $t.Length))
