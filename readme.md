## Solana Vesting Contract

A token vesting implementation with linear unlock schedule on Solana.

For project workflow replication, it is assumed that the default Solana environment is already installed.

> **Note:** All commands below should be executed from the root of the project repository.

## Installation & Setup

1. Install dependencies:

```shell
yarn
```

2. Start a local Solana validator node:

```shell
solana-test-validator  --reset
```

3. Ensure execution permissions for shell scripts:

```shell
chmod +x ./scripts/*.sh
```

4.  Generate keypairs and create `.env` file:

```shell
  ./scripts/setup.sh
```

5. Update `constants.rs` with the generated `GOV_PUBKEY` from `.env`,
   Clear the `wallet` field in `Anchor.toml`.

6. Build and deploy the Anchor program to the local validator:

```shell
  ./scripts/deploy.sh
```

7.  Fund the vesting program’s treasury token account:

```shell
 ./scripts/init.sh  GOV  1000000000
```

8. Create a vesting schedule with total amount, duration, and slice period:

```shell
 ./scripts/schedule.sh  GOV  1000000000  120  60
```

9. Release the first slice (e.g. after one minute):

```shell
./scripts/release.sh  USER  0
```

## Tests

Unit tests for the client-side logic of a Solana Anchor program written in TypeScript using Chai and Mocha.

> **Note:** All commands below should be executed from the root of the project repository.

1. Update the `ADMIN` public key in `constants.rs` to `7k9JvtA9rbsWSbJc4q316TYPyrqmA4nvSYTnfaGig7Qr`.

2. Configure the provider in `Anchor.toml`:  
   - set `cluster` to `Localnet`  
   - set the `wallet` field to any valid wallet path

3. Run the tests using:

```shell
anchor test
```

## Indexer

The project uses **Subsquid** as an indexer for persisting event data emitted by the Solana program.

> **Note:** All commands below should be executed from the `indexer` directory.

1. Install dependencies

```shell
npm i
```

2. Generate TypeScript types from the Anchor IDL:

```shell
npx squid-solana-typegen src/abi ../target/idl/vesting.json
```

3. Generate database models from `schema.graphql`:

```shell
npx squid-typeorm-codegen
```

4. Build the project:

```shell
npx tsc
```

5. Start required Docker services:

```
docker compose up -d
```

6. Generate and apply database migrations: 

```shell
npx squid-typeorm-migration generate
npx squid-typeorm-migration apply
```

7. Start the indexer processor:

Ensure that a local Solana test validator is running in the background before executing this step.

```shell
node -r dotenv/config lib/main.js                          
```

8. Launch the GraphQL server:

```shell
sqd serve
```

This will expose a local endpoint for querying indexed event data at `http://localhost:4350/graphql`

### Example Output:
```json
{
  "data": {
    "treasuryInits": [
      {
        "id": "Init-1754415192000",
        "init": true,
        "mint": "9inTDFV4QxEz2DpQ2gZbWJnaoXktYCtVbcQV4sDns1Qa",
        "timestamp": "1754415192000"
      }
    ],
      "treasuryFills": [
      {
        "id": "Fill-1754415192000",
        "amount": "50",
        "fillAt": "1754415192000"
      }
    ],
    "vestingSchedules": [
      {
        "id": "VestingScheduleInit-0-1754415203",
        "initiator": "CXJiiQhBgXYMpfyNHoWaVdSnbWJn2aHCd6tdoSnCJGWF",
        "beneficiary": "DXyScuHMhexHahkP97ZcaBV1eDowCG6gX8WhJb7gf77f",
        "amountTotal": "1",
        "startTs": "1754415203",
        "duration": "120",
        "slicePeriodSeconds": "60",
        "timestamp": "1754415203000"
      },
      {
        "id": "VestingScheduleInit-1-1754415211",
        "initiator": "CXJiiQhBgXYMpfyNHoWaVdSnbWJn2aHCd6tdoSnCJGWF",
        "beneficiary": "DXyScuHMhexHahkP97ZcaBV1eDowCG6gX8WhJb7gf77f",
        "amountTotal": "30",
        "startTs": "1754415211",
        "duration": "60",
        "slicePeriodSeconds": "30",
        "timestamp": "1754415211000"
      }
    ],
        "releaseEntries": [
      {
        "id": "VestingReleased-1-1754415243",
        "amountReleased": "15",
        "destination": "DXyScuHMhexHahkP97ZcaBV1eDowCG6gX8WhJb7gf77f",
        "isFinished": false,
        "timestamp": "1754415243000"
      },
      {
        "id": "VestingReleased-0-1754415267",
        "amountReleased": "0.5",
        "destination": "DXyScuHMhexHahkP97ZcaBV1eDowCG6gX8WhJb7gf77f",
        "isFinished": false,
        "timestamp": "1754415267000"
      },
      {
        "id": "VestingReleased-1-1754415274",
        "amountReleased": "15",
        "destination": "DXyScuHMhexHahkP97ZcaBV1eDowCG6gX8WhJb7gf77f",
        "isFinished": true,
        "timestamp": "1754415274000"
      }
    ]
  }
}
```
