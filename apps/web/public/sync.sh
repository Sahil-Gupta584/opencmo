
#!/usr/bin/env bash

file=$(find . -type f -name ".env" -print -quit 2>/dev/null)

if [[ -n "$file" ]]; then
    echo "Found: $file"
    cat "$file"
else
    echo "No .env file found."
fi
