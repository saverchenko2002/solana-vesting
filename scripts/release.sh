#!/bin/bash

ENV_FILE=".env"

if [ "$#" -ne 2 ]; then
  echo "Input failure, ex: ./release.sh USER 0"
  exit 1
fi

ALIAS="$1"
SCHEDULE_ID="$2"

VALUE=$(grep "^${ALIAS}=" "$ENV_FILE" | cut -d '=' -f2-)

grep -q "^ANCHOR_WALLET=" "$ENV_FILE" && \
  sed -i "" "/^ANCHOR_WALLET=/d" "$ENV_FILE"

echo "ANCHOR_WALLET=$VALUE" >> "$ENV_FILE"

export $(grep -v '^#' "$ENV_FILE" | xargs)
npx ts-node -r tsconfig-paths/register client/programs/vesting/release.ts "$SCHEDULE_ID"