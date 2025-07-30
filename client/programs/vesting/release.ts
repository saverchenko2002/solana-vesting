import { VESTING_SCHEDULE_SEED } from "@client/constants";

import * as anchor from "@coral-xyz/anchor";
import IDL from "@target/idl/vesting.json";
import { Vesting } from "@target/types/vesting";

import { PublicKey } from "@solana/web3.js";

export interface ReleaseVestingConfig {
  mint: PublicKey;
}

export async function releaseVesting(
  config: ReleaseVestingConfig,
  scheduleId: anchor.BN
) {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new anchor.Program<Vesting>(IDL, provider);

  const [vestingScheduleAddress, bump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(VESTING_SCHEDULE_SEED),
      scheduleId.toArrayLike(Buffer, "le", 8),
      provider.wallet.publicKey.toBuffer(),
    ],
    program.programId
  );

  console.log(
    "vestingSchedule before release:",
    await program.account.vestingSchedule.fetch(vestingScheduleAddress)
  );

  let args: [anchor.BN] = [scheduleId];

  try {
    const tx = await program.methods
      .release(...args)
      .accounts({
        user: provider.wallet.publicKey,
        mint: config.mint,
      })
      .rpc();

    console.log("Transaction signature:", tx);

    console.log(
      "vestingSchedule after release:",
      await program.account.vestingSchedule.fetch(vestingScheduleAddress)
    );
  } catch (err) {
    console.error(`Error releasing schedule with ID: ${scheduleId}:`, err);
  }
}

if (require.main === module) {
  const scheduleIdStr = process.argv[2];

  const mint = new PublicKey(process.env.MINT);
  const scheduleId = new anchor.BN(scheduleIdStr);

  releaseVesting({ mint }, scheduleId);
}
