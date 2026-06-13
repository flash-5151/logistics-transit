#!/usr/bin/env bash
# install.sh — Single-command setup for Linux / macOS
set -e

echo "Installing frontend dependencies..."
npm install $(grep -v '^\s*$' requirements.txt | xargs)
echo "Done. Run 'npm run dev' to start the development server."
