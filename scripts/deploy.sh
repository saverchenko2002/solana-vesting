#!/bin/bash

set -o allexport
source .env
set +o allexport

ENV_FILE=".env"

solana config set --url "$ANCHOR_PROVIDER_URL"
solana config set --keypair "$GOV"

anchor build 

set_env_var () {
  VAR_NAME=$1
  VAR_VALUE=$2
  if grep -q "^$VAR_NAME=" "$ENV_FILE" 2>/dev/null; then
    sed -i '' "s|^$VAR_NAME=.*|$VAR_NAME=$VAR_VALUE|" "$ENV_FILE" 2>/dev/null || \
    sed -i "s|^$VAR_NAME=.*|$VAR_NAME=$VAR_VALUE|" "$ENV_FILE"
  else
    echo "$VAR_NAME=$VAR_VALUE" >> "$ENV_FILE"
  fi
}

echo "Deploying via anchor..."
DEPLOY_LOG=$(anchor deploy 2>&1)
echo "$DEPLOY_LOG"

PROGRAM_ID=$(echo "$DEPLOY_LOG" | grep -oE 'Program Id: [A-Za-z0-9]{32,44}' | awk '{print $3}')

if [ -n "$PROGRAM_ID" ]; then
  echo "Program deployed: $PROGRAM_ID"
  set_env_var "PROGRAM_ID" "$PROGRAM_ID"
fi

