#!/bin/bash

set -e

GOV_KEY=gov.json
USER_KEY=user.json

ANCHOR_PROVIDER_URL="http://127.0.0.1:8899"

rm -f $GOV_KEY $USER_KEY
solana-keygen new --no-passphrase --outfile $GOV_KEY
solana-keygen new --no-passphrase --outfile $USER_KEY
solana config set --url $ANCHOR_PROVIDER_URL --keypair $GOV_KEY

GOV_PUBKEY=$(solana-keygen pubkey $GOV_KEY)
USER_PUBKEY=$(solana-keygen pubkey $USER_KEY)

echo "Gov pubkey: $GOV_PUBKEY"
echo "User pubkey: $USER_PUBKEY"

solana airdrop 1000 $GOV_PUBKEY
solana airdrop 1 $USER_PUBKEY

TOKEN_ADDRESS=$(spl-token create-token --owner $GOV_KEY | grep -oE "[A-Za-z0-9]{43,44}" | head -1)

echo "Token address: $TOKEN_ADDRESS"

ENV_FILE=".env"

set_env_var () {
  VAR_NAME=$1
  VAR_VALUE=$2
  if grep -q "^$VAR_NAME=" $ENV_FILE 2>/dev/null; then
    sed -i '' "s|^$VAR_NAME=.*|$VAR_NAME=$VAR_VALUE|" $ENV_FILE
  else
    echo "$VAR_NAME=$VAR_VALUE" >> $ENV_FILE
  fi
}

touch $ENV_FILE

set_env_var "ANCHOR_PROVIDER_URL" "$ANCHOR_PROVIDER_URL"
set_env_var "GOV" "$(realpath $GOV_KEY)"
set_env_var "USER" "$(realpath $USER_KEY)"
set_env_var "MINT" "$TOKEN_ADDRESS"
set_env_var "USER_PUBKEY" "$USER_PUBKEY"
set_env_var "GOV_PUBKEY" "$GOV_PUBKEY"

echo ".env file created/updated successfully:"
cat $ENV_FILE