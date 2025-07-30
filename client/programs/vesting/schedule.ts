import { VESTING_INFO_SEED, VESTING_SCHEDULE_SEED } from "@client/constants";

import * as anchor from "@coral-xyz/anchor";
import IDL from "@target/idl/vesting.json";
import { Vesting } from "@target/types/vesting";

import { PublicKey } from "@solana/web3.js";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

export interface CreateScheduleConfig {
  user: PublicKey;
  mint: PublicKey;
}

export async function createSchedule(
  config: CreateScheduleConfig,
  amount: anchor.BN,
  duration: anchor.BN,
  slicePeriodSeconds: anchor.BN
) {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new anchor.Program<Vesting>(IDL, provider);

  const [vestingInfoAddress, _] = PublicKey.findProgramAddressSync(
    [Buffer.from(VESTING_INFO_SEED)],
    program.programId
  );

  const vestingInfo = await program.account.vestingInfo.fetch(
    vestingInfoAddress
  );

  const [vestingScheduleAddress, bump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(VESTING_SCHEDULE_SEED),
      vestingInfo.lastScheduleId.toArrayLike(Buffer, "le", 8),
      config.user.toBuffer(),
    ],
    program.programId
  );

  console.log("vestingScheduleAddress: ", vestingScheduleAddress);

  const userAtaAddress = getAssociatedTokenAddressSync(
    config.mint,
    config.user,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const args: [anchor.BN, anchor.BN, anchor.BN, anchor.BN] = [
    vestingInfo.lastScheduleId,
    amount,
    duration,
    slicePeriodSeconds,
  ];

  try {
    const tx = await program.methods
      .schedule(...args)
      .accounts({
        admin: provider.wallet.publicKey,
        user: config.user,
        mint: config.mint,
      })
      .rpc();

    console.log("Transaction signature:", tx);

    const vestingScheduleAccount = await program.account.vestingSchedule.fetch(
      vestingScheduleAddress
    );
    console.log("vestingSchedule:", vestingScheduleAccount);

    console.log("userAta:", userAtaAddress);
  } catch (err) {
    console.error("Error initializing vesting schedule:", err);
  }
}

if (require.main === module) {
  const amountStr = process.argv[2];
  const durationStr = process.argv[3];
  const slicePeriodSecondsStr = process.argv[4];

  const mint = new PublicKey(process.env.MINT);
  const user = new PublicKey(process.env.USER_PUBKEY);
  const amount = new anchor.BN(amountStr);
  const duration = new anchor.BN(durationStr);
  const slicePeriodSeconds = new anchor.BN(slicePeriodSecondsStr);

  createSchedule({ mint, user }, amount, duration, slicePeriodSeconds);
}
