$ErrorActionPreference = "Stop"

$legacyFiles = @(
  "src/integrations/supabase/auth-attacher.ts",
  "src/integrations/supabase/client.ts",
  "src/integrations/supabase/client.server.ts",
  "src/integrations/supabase/types.ts"
)

foreach ($file in $legacyFiles) {
  if (Test-Path $file) {
    Remove-Item $file -Force
    Write-Host "Removed $file"
  }
}

Write-Host ""
Write-Host "Legacy Supabase client files removed."
Write-Host "Kept src/integrations/supabase/auth-middleware.ts because it now validates Cloudflare D1 admin sessions."
