#!/bin/bash

ENV_FILE=".env"

if [ "$#" -ne 4 ]; then
  echo "Input failure, ex: ./schedule.sh GOV 1000000000 600 60"
  exit 1
fi


ALIAS="$1"
AMOUNT="$2"
DURATION="$3"
SLICE_PERIOD_SECONDS="$4"

VALUE=$(grep "^${ALIAS}=" "$ENV_FILE" | cut -d '=' -f2-)


grep -q "^ANCHOR_WALLET=" "$ENV_FILE" && \
  sed -i "" "/^ANCHOR_WALLET=/d" "$ENV_FILE"

echo "ANCHOR_WALLET=$VALUE" >> "$ENV_FILE"

export $(grep -v '^#' "$ENV_FILE" | xargs)
npx ts-node -r tsconfig-paths/register client/programs/vesting/schedule.ts "$AMOUNT" "$DURATION" "$SLICE_PERIOD_SECONDS"