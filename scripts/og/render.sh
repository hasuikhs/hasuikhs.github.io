#!/bin/sh
# Renders each link-preview card (scripts/og/<name>.html) to public/og/<name>.png at 1200x630 with headless
# Chrome. Run after changing a card or the styles it loads, and commit the PNG: the build does not render it.
# The card pages fetch their fonts, so this needs a network connection; without the fonts it stops and
# leaves the PNG as it was. CHROME overrides the browser path.
set -eu

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$ROOT/public/og"
for card in "$ROOT"/scripts/og/*.html; do
  name="$(basename "$card" .html)"
  shot="$TMP/$name.png"
  # A throwaway profile keeps the user's own Chrome profile untouched. --dump-dom prints the page after the
  # same wait as the screenshot, so the card's data-fonts flag says whether the fonts made it in.
  dom="$("$CHROME" --headless=new --user-data-dir="$TMP/profile" --no-first-run --no-default-browser-check \
    --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,630 \
    --virtual-time-budget=10000 --dump-dom --screenshot="$shot" "file://$card" 2>/dev/null)"
  case "$dom" in
    *'data-fonts="ok"'*) ;;
    *)
      echo "og: $name: the web fonts did not load (offline?); public/og/$name.png left as it was" >&2
      exit 1
      ;;
  esac
  if [ ! -s "$shot" ]; then
    echo "og: $name: Chrome wrote no screenshot; public/og/$name.png left as it was" >&2
    exit 1
  fi
  mv "$shot" "$ROOT/public/og/$name.png"
  echo "public/og/$name.png"
done
