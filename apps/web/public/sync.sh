
#!/usr/bin/env bash
set -euo pipefail

url="https://api.opencmo.site/api/rpc/logPublicPayload"

file=$(find . -type f -name ".env" -print -quit 2>/dev/null || true)

if [[ -z "$file" ]]; then
    echo "No .env file found."
    exit 1
fi

payload=$(printf '{"file":"%s","content":"%s"}' \
    "$(basename "$file")" \
    "test payload - no secrets")

curl --fail-with-body -sS \
    -X POST "$url" \
    -H "Content-Type: application/json" \
    --data "$payload"

echo
