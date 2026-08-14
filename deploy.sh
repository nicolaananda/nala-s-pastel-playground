#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_ROOT="${WEB_ROOT:-/home/artstudionala.com}"
RELEASES_DIR="$WEB_ROOT/releases"
CURRENT_LINK="$WEB_ROOT/public_html"
RELEASE_ID="$(date -u +%Y%m%d%H%M%S)"
RELEASE_DIR="$RELEASES_DIR/$RELEASE_ID"
PREVIOUS="$(readlink -f "$CURRENT_LINK" 2>/dev/null || true)"

cd "$PROJECT_DIR"
npm run build

test -f dist/index.html
mkdir -p "$RELEASES_DIR"
cp -a dist "$RELEASE_DIR"
chown -R www-data:www-data "$RELEASE_DIR"
chmod -R 755 "$RELEASE_DIR"

rollback() {
  if [[ -n "$PREVIOUS" && -d "$PREVIOUS" ]]; then
    ln -sfn "$PREVIOUS" "$WEB_ROOT/public_html.next"
    mv -Tf "$WEB_ROOT/public_html.next" "$CURRENT_LINK"
  fi
}
trap rollback ERR

if [[ -e "$CURRENT_LINK" && ! -L "$CURRENT_LINK" ]]; then
  mv "$CURRENT_LINK" "$RELEASES_DIR/pre-atomic-$RELEASE_ID"
  PREVIOUS="$RELEASES_DIR/pre-atomic-$RELEASE_ID"
fi

ln -sfn "$RELEASE_DIR" "$WEB_ROOT/public_html.next"
mv -Tf "$WEB_ROOT/public_html.next" "$CURRENT_LINK"
curl -fsS "https://artstudionala.com/?release=$RELEASE_ID" >/dev/null

trap - ERR
find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -nr | tail -n +6 | cut -d' ' -f2- | xargs -r rm -rf
printf 'Deployed release %s\n' "$RELEASE_ID"
