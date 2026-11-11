$ErrorActionPreference = 'Stop'

# Resolve directories relative to this script
$current = $PSScriptRoot
$root = Split-Path -Parent $current

# Define paths
$source = Join-Path $current 'src/ExerciseRunner.java'
$classes = Join-Path $current 'build/classes'
$jarDir = Join-Path $root 'content/java'
$jarFile = Join-Path $jarDir 'ExerciseRunner.jar'

# Verify source exists
if (-not (Test-Path $source)) {
    throw "Source file not found: $source"
}

# Ensure output directories exist
New-Item -ItemType Directory -Force -Path $classes | Out-Null
New-Item -ItemType Directory -Force -Path $jarDir | Out-Null

# Clean previous compiled classes
Get-ChildItem -Path $classes -Force | Remove-Item -Recurse -Force

# Compile
Write-Host 'Compiling ExerciseRunner.java...'
javac --release 21 -encoding UTF-8 -d $classes $source

if ($LASTEXITCODE -ne 0) {
    throw 'Java compilation failed.'
}

# Remove previous JAR
if (Test-Path $jarFile) {
    Remove-Item $jarFile -Force
}

# Create JAR
Write-Host 'Creating ExerciseRunner.jar...'
jar --create --file $jarFile -C $classes .

if ($LASTEXITCODE -ne 0) {
    throw 'JAR creation failed.'
}

Write-Host "Build successful: $jarFile" -ForegroundColor Green