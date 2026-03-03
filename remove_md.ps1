Get-ChildItem -Recurse -Filter '*.md' | Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.Name -ne 'README.md' } | Remove-Item -Force
