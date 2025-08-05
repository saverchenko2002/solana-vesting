import * as anchor from "@coral-xyz/anchor";

import { createMint, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export const vestedAmount = LAMPORTS_PER_SOL;
export const duration = 4;
export const slicePeriodSeconds = 2;
export const mintAmount = LAMPORTS_PER_SOL;
export const mintDecimals = 9;

export const nonExistingScheduleId = 1;

export const treasuryAuthoritySeed = "treasury_authority";
export const vestingInfoSeed = "vesting_info";
export const vestingScheduleSeed = "vesting_schedule";

export let admin: Keypair;
export let user: Keypair;
export let mint: PublicKey;
export let fakeMint: PublicKey;

anchor.setProvider(anchor.AnchorProvider.env());
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

before(async () => {
  admin = Keypair.fromSecretKey(
    Uint8Array.from([
      82, 43, 63, 96, 182, 242, 34, 235, 18, 205, 38, 138, 117, 236, 94, 122,
      45, 37, 98, 198, 94, 25, 103, 195, 97, 205, 107, 1, 179, 99, 183, 168,
      100, 51, 125, 211, 3, 146, 227, 58, 224, 68, 44, 227, 9, 170, 130, 7, 152,
      154, 248, 131, 39, 104, 14, 116, 8, 242, 70, 87, 90, 239, 174, 135,
    ])
  );

  user = Keypair.fromSecretKey(
    Uint8Array.from([
      122, 95, 75, 164, 47, 75, 108, 56, 113, 208, 37, 33, 35, 54, 41, 70, 83,
      34, 170, 8, 85, 140, 43, 250, 22, 44, 154, 31, 58, 212, 218, 124, 162, 85,
      238, 255, 48, 202, 155, 182, 173, 15, 124, 128, 181, 23, 177, 160, 128,
      242, 175, 112, 103, 214, 169, 107, 70, 52, 153, 236, 69, 97, 179, 132,
    ])
  );

  await requestAidrop(provider, admin, LAMPORTS_PER_SOL);
  await requestAidrop(provider, user, LAMPORTS_PER_SOL);

  mint = await createMint(
    provider.connection,
    admin,
    admin.publicKey,
    null,
    mintDecimals,
    undefined,
    {
      commitment: "confirmed",
    },

    TOKEN_PROGRAM_ID
  );

  fakeMint = await createMint(
    provider.connection,
    user,
    user.publicKey,
    null,
    mintDecimals,
    undefined,
    {
      commitment: "confirmed",
    },

    TOKEN_PROGRAM_ID
  );
});

async function requestAidrop(
  provider: anchor.AnchorProvider,
  user: Keypair,
  lamports: number
) {
  const aidropSignature = await provider.connection.requestAirdrop(
    user.publicKey,
    lamports
  );

  let latestBlockHash = await provider.connection.getLatestBlockhash();

  await provider.connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: aidropSignature,
  });
}
