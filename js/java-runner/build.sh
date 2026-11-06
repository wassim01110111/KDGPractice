#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/java-runner/src"
BUILD="$ROOT/java-runner/build"
OUT="$ROOT/content/java/ExerciseRunner.jar"
rm -rf "$BUILD"
mkdir -p "$BUILD/classes" "$(dirname "$OUT")"
javac --release 21 -encoding UTF-8 -proc:none -d "$BUILD/classes" \
  "$SRC/learning/java/ExerciseRunner.java"
jar --create --file "$OUT" --main-class learning.java.ExerciseRunner -C "$BUILD/classes" .
echo "Built $OUT"
