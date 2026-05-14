$file = "C:\Users\Abela\CascadeProjects\tokenguard\dashboard\app\signup\page.tsx"
$content = [System.IO.File]::ReadAllText($file, [System.Text.UTF8Encoding]::new($false))

# Replace corrupted right arrow â†' with proper →
$content = $content.Replace('â†'', '→')

# Replace corrupted left arrow â† with proper ←
$content = $content.Replace('â†', '←')

[System.IO.File]::WriteAllText($file, $content, [System.Text.UTF8Encoding]::new($false))
Write-Host "Fixed arrow characters" -ForegroundColor Green
