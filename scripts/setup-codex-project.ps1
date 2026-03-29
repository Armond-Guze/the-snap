$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$CodexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME ".codex" }
$SkillName = "the-snap-studio-workflow"
$SkillSrc = Join-Path $RootDir "codex\skills\$SkillName"
$SkillDstRoot = Join-Path $CodexHome "skills"
$SkillDst = Join-Path $SkillDstRoot $SkillName

if (-not (Test-Path $SkillSrc)) {
  throw "Missing skill source: $SkillSrc"
}

New-Item -ItemType Directory -Force -Path $SkillDstRoot | Out-Null

if (Test-Path $SkillDst) {
  Remove-Item -Recurse -Force $SkillDst
}

Copy-Item -Recurse -Force $SkillSrc $SkillDst

Write-Host ""
Write-Host "Codex project setup complete."
Write-Host ""
Write-Host "Installed skill:"
Write-Host "  $SkillName -> $SkillDst"
Write-Host ""
Write-Host "Project context:"
Write-Host "  $(Join-Path $RootDir 'AGENTS.md')"
Write-Host ""
Write-Host "Next steps on your PC:"
Write-Host "  1. Open this repo root in Codex desktop or Codex CLI"
Write-Host "  2. Run npm install"
Write-Host "  3. Start local dev with npm run dev"
Write-Host ""
Write-Host "What Codex will know from this setup:"
Write-Host "  - The Snap repo structure"
Write-Host "  - Sanity Studio article workflow"
Write-Host "  - Power rankings workflow"
Write-Host "  - Tag / topic hub / team ref rules"
Write-Host "  - Headline rewrite format"
Write-Host "  - Power rankings rewrite format"
Write-Host ""
Write-Host "Optional bootstrap prompt:"
Write-Host "  $(Join-Path $RootDir 'codex\START-HERE.md')"
Write-Host ""
