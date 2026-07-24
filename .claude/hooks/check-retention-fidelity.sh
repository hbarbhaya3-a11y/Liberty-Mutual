#!/bin/bash
# ============================================================================
# Retention Fidelity Check · PostToolUse hook
#
# Fires after Write or Edit on any retention-scoped file. Enforces:
#   (1) No individual customer first names (cohort-level language only)
#   (2) Pre-sim range strings must carry "· est. range" suffix
#   (3) Engine slot "D · Deepen/defend balances" not silently downgraded
#
# Exits 2 on violation -> Claude Code reports the failure and the write is
# treated as a blocked operation that must be remediated.
# ============================================================================
set -u

# ---- Read hook payload from stdin (Claude Code passes JSON) ----
INPUT=$(cat)

# Extract the file_path field — works on both Write and Edit tool payloads.
# Fallback: try tool_input.file_path nesting.
FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    fp = d.get('tool_input', {}).get('file_path') or d.get('file_path') or ''
    print(fp)
except Exception:
    print('')
" 2>/dev/null)

# If we couldn't parse the path, exit cleanly — don't block.
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only check retention-scoped files. This explicitly excludes gig files
# (which are intentionally untouched per the build plan).
case "$FILE_PATH" in
  *retention*|*Retention*)
    : # in scope
    ;;
  *)
    exit 0
    ;;
esac

# If the file doesn't exist (yet), exit — Edit will have failed elsewhere.
if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

VIOLATIONS=""

# ---- Rule 1 · No individual customer first names ----
# Captures the gig journey's archetype names + common first-name leaks. New
# violations to add as patterns evolve.
BANNED_NAMES="Marcus|Aisha|Rosa|Helen|Arthur|Margaret|Devon|Priya|Walter|Beatrice|Diane|Sarah Jones|David Smith|Jane Doe|John Smith|Mary Smith|Mike Brown|Robert Davis"

# Word-boundary check, exclude license / comment headers etc by checking
# only the *content* lines (skip lines that obviously aren't user-facing).
name_hits=$(grep -nE "\b($BANNED_NAMES)\b" "$FILE_PATH" 2>/dev/null \
  | grep -vE "^\s*//\s*(banned|forbidden|never|don'?t|do not)" \
  || true)

if [ -n "$name_hits" ]; then
  VIOLATIONS+="
❌ Rule 1 · Individual customer name found (cohort-level language only)

$name_hits

Fix: replace with cohort-descriptor labels like 'Drifting Saver', 'Operating Decliner',
'22K rate-sensitive mass-affluent', or remove if not user-facing.
"
fi

# ---- Rule 2 · Pre-sim ranges must carry "· est. range" ----
# Detects patterns like +$X-YM / -X to -Ypp / X-Y% that read as pre-sim
# ranges but lack the est-range marker. Skips matches that already have
# "· est. range" within ~80 chars or are inside data calibration constants
# (object keys ending in "M:" or "K:" or a number-only literal).
range_violations=$(grep -nE "(\+\\\$[0-9]+\s*[–\-]\s*[0-9]+[MK]|−?[0-9]+(\.[0-9]+)?\s*to\s*−?[0-9]+(\.[0-9]+)?pp)" "$FILE_PATH" 2>/dev/null \
  | grep -v "est\. range" \
  | grep -v "//" \
  | grep -v "^\s*[a-zA-Z_]*[MK]:" \
  || true)

if [ -n "$range_violations" ]; then
  VIOLATIONS+="
⚠ Rule 2 · Pre-sim range missing '· est. range' suffix

$range_violations

Fix: append ' · est. range' to pre-simulation range values. Post-simulation
point estimates can omit the suffix but must show CI bounds.
"
fi

# ---- Rule 3 · Theme engine must be D (Deepen/defend balances) ----
# Only checks files that declare an engine field — guards against accidentally
# downgrading retention to a different engine slot during refactors.
if grep -qE "^\s*engine:\s*" "$FILE_PATH" 2>/dev/null; then
  if ! grep -qE 'engine:\s*"D"' "$FILE_PATH" 2>/dev/null; then
    engine_hit=$(grep -nE "^\s*engine:\s*" "$FILE_PATH" 2>/dev/null)
    VIOLATIONS+="
❌ Rule 3 · Retention theme must use engine 'D' (Deepen/defend balances)

$engine_hit

Fix: ensure engine: 'D' is preserved. Engine D is the unused slot retention
was designed to occupy (engines A/B/C/E are used by other themes).
"
  fi
fi

# ---- Result ----
if [ -n "$VIOLATIONS" ]; then
  echo "════════════════════════════════════════════════════════════════════════════" >&2
  echo "RETENTION FIDELITY CHECK · $FILE_PATH" >&2
  echo "════════════════════════════════════════════════════════════════════════════" >&2
  echo "$VIOLATIONS" >&2
  echo "════════════════════════════════════════════════════════════════════════════" >&2
  echo "Source: .claude/hooks/check-retention-fidelity.sh · see RETENTION_JOURNEY_BLUEPRINT.md for the full rule set." >&2
  exit 2
fi

exit 0
