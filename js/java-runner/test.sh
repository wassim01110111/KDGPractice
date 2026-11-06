#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
"$ROOT/java-runner/build.sh"
node "$ROOT/java-runner/tests/smoke.mjs"
node --experimental-default-type=module "$ROOT/java-runner/tests/worker-watchdog.mjs"
