$file = "C:\Users\Abela\CascadeProjects\tokenguard\dashboard\app\signup\page.tsx"
$content = [System.IO.File]::ReadAllText($file, [System.Text.UTF8Encoding]::new($false))

# Use char codes to avoid any copy-paste / quote issues
$emDash = [char]0x2014   # —
$enDash = [char]0x2013   # –
$arrow  = [char]0x2192   # →
$ellip  = [char]0x2026   # …

# Build corrupted patterns using char codes (these are the Windows-1252 bytes
# misinterpreted as UTF-8: â=0xE2 €=0x20AC "=0x201D etc.)
$c_em   = [char]0xE2 + [char]0x20AC + [char]0x201D  # â€" (corrupted em dash)
$c_en   = [char]0xE2 + [char]0x20AC + [char]0x201C  # â€" (corrupted en dash)
$c_arr  = [char]0xE2 + [char]0x2020 + [char]0x2019  # â†' (corrupted arrow)

# Line 69
$content = $content.Replace("Fallback $c_em if", "Fallback $emDash if")
# Line 73
$content = $content.Replace("payments $c_em proceeding", "payments $emDash proceeding")
# Line 133
$content = $content.Replace("payment $c_em `$", "payment $emDash `$")
$content = $content.Replace("mo $c_arr", "mo $arrow")
# Lines 383-385 (en dashes)
$content = $content.Replace("2$c_en" + "10", "2$enDash" + "10")
$content = $content.Replace("11$c_en" + "50", "11$enDash" + "50")
$content = $content.Replace("51$c_en" + "200", "51$enDash" + "200")
# Line 532
$content = $content.Replace("`"$c_em`"", "`"$emDash`"")

[System.IO.File]::WriteAllText($file, $content, [System.Text.UTF8Encoding]::new($false))
Write-Host "Done - fixed corrupted characters" -ForegroundColor Green
