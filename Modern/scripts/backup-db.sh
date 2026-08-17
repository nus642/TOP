#!/usr/bin/env bash
# Daily MySQL backup for the TOP deployment. Keeps the last 7 days.
#
# Install (as the deploy user):
#   chmod +x scripts/backup-db.sh
#   crontab -e   ->   30 3 * * * /opt/top/Modern/scripts/backup-db.sh >> /opt/top/backups/backup.log 2>&1
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/opt/top/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Reuse the same MYSQL_* variables as the application (.env format).
if [[ -f "$APP_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$APP_DIR/.env"
  set +a
fi

: "${MYSQL_HOST:=localhost}"
: "${MYSQL_PORT:=3306}"
: "${MYSQL_USER:?MYSQL_USER is required}"
: "${MYSQL_PASS:?MYSQL_PASS is required}"
: "${MYSQL_DB:=nhpa}"

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
TARGET="$BACKUP_DIR/$MYSQL_DB-$STAMP.sql.gz"

mysqldump \
  --host="$MYSQL_HOST" \
  --port="$MYSQL_PORT" \
  --user="$MYSQL_USER" \
  --password="$MYSQL_PASS" \
  --single-transaction \
  --routines \
  "$MYSQL_DB" | gzip > "$TARGET"

# Drop archives older than the retention window.
find "$BACKUP_DIR" -name "$MYSQL_DB-*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "$(date '+%F %T') backup ok: $TARGET"
