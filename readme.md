## Solana Vesting Contract

A token vesting implementation with linear unlock schedule on Solana.

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
