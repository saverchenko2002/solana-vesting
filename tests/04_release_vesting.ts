import * as anchor from "@coral-xyz/anchor";
import { Vesting } from "@target/types/vesting";

import { assert } from "chai";
import { PublicKey } from "@solana/web3.js";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

import {
  admin,
  user,
  mint,
  fakeMint,
  mintAmount,
  vestedAmount,
  duration,
  slicePeriodSeconds,
  treasuryAuthoritySeed,
  vestingInfoSeed,
  vestingScheduleSeed,
  nonExistingScheduleId,
} from "./00_setup_tests";
import { Account } from "@solana/spl-token";

describe("Create Release Tests", async () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Vesting as anchor.Program<Vesting>;

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const [treasuryAuthorityAddress, _] = PublicKey.findProgramAddressSync(
    [Buffer.from(treasuryAuthoritySeed)],
    program.programId
  );

  const [vestingInfoAddress, vestingInfoBump] =
    PublicKey.findProgramAddressSync(
      [Buffer.from(vestingInfoSeed)],
      program.programId
    );

  let vestingScheduleAddress: PublicKey;
  let userAtaAddress: PublicKey;
  let treasuryAtaAddress: PublicKey;
  let _vestingScheduleBump: number;

  before(async () => {
    const vestingInfo = await program.account.vestingInfo.fetch(
      vestingInfoAddress
    );

    [vestingScheduleAddress, _vestingScheduleBump] =
      PublicKey.findProgramAddressSync(
        [
          Buffer.from(vestingScheduleSeed),
          vestingInfo.lastScheduleId
            .sub(new anchor.BN(1))
            .toArrayLike(Buffer, "le", 8),
          user.publicKey.toBuffer(),
        ],
        program.programId
      );

    userAtaAddress = getAssociatedTokenAddressSync(
      mint,
      user.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    treasuryAtaAddress = getAssociatedTokenAddressSync(
      mint,
      treasuryAuthorityAddress,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
  });

  /// Client-side error
  it("should fail if release non existing vesting", async () => {});
  /// Client-side error
  it("should fail if release not owned vesting", async () => {});
  /// Client-side error
  it("should fail if release with not matching mint", async () => {});

  it("should fail if release before slice period", async () => {
    let error: anchor.AnchorError;

    const vestingInfo = await program.account.vestingInfo.fetch(
      vestingInfoAddress
    );

    try {
      await program.methods
        .release(vestingInfo.lastScheduleId.sub(new anchor.BN(1)))
        .accounts({
          user: user.publicKey,
          mint: mint,
        })
        .signers([user])
        .rpc();
    } catch (err) {
      error = err as anchor.AnchorError;
    }

    assert.equal(error.error.errorCode.code, "NothingToRelease");
  });

  it("should release vesting schedule 1st slice", async () => {
    const vestingInfo = await program.account.vestingInfo.fetch(
      vestingInfoAddress
    );

    await new Promise((resolve) =>
      setTimeout(resolve, slicePeriodSeconds * 1000)
    );

    await program.methods
      .release(vestingInfo.lastScheduleId.sub(new anchor.BN(1)))
      .accounts({
        user: user.publicKey,
        mint: mint,
      })
      .signers([user])
      .rpc();

    const userTokenBalance = await provider.connection.getTokenAccountBalance(
      userAtaAddress
    );

    const vestingTreasuryTokenBalance =
      await provider.connection.getTokenAccountBalance(treasuryAtaAddress);

    assert.equal(
      Number(userTokenBalance.value.amount),
      vestedAmount / (duration / slicePeriodSeconds)
    );

    assert.equal(
      Number(vestingTreasuryTokenBalance.value.amount),
      vestedAmount / (duration / slicePeriodSeconds)
    );

    const vestingScheduleFirstSlice =
      await program.account.vestingSchedule.fetch(vestingScheduleAddress);

    assert.equal(
      vestingScheduleFirstSlice.released.toNumber(),
      vestedAmount / (duration / slicePeriodSeconds)
    );
  });

  it("should release vesting schedule 2nd slice", async () => {
    const vestingInfo = await program.account.vestingInfo.fetch(
      vestingInfoAddress
    );

    await new Promise((resolve) =>
      setTimeout(resolve, slicePeriodSeconds * 1000)
    );

    await program.methods
      .release(vestingInfo.lastScheduleId.sub(new anchor.BN(1)))
      .accounts({
        user: user.publicKey,
        mint: mint,
      })
      .signers([user])
      .rpc();

    const userTokenBalance = await provider.connection.getTokenAccountBalance(
      userAtaAddress
    );

    const vestingTreasuryTokenBalance =
      await provider.connection.getTokenAccountBalance(treasuryAtaAddress);

    assert.equal(Number(userTokenBalance.value.amount), vestedAmount);

    assert.equal(Number(vestingTreasuryTokenBalance.value.amount), 0);

    const vestingScheduleFirstSlice =
      await program.account.vestingSchedule.fetch(vestingScheduleAddress);

    assert.equal(vestingScheduleFirstSlice.released.toNumber(), vestedAmount);
  });

  it("should fail if release finished vesting", async () => {
    let error: anchor.AnchorError;

    const vestingInfo = await program.account.vestingInfo.fetch(
      vestingInfoAddress
    );

    try {
      await program.methods
        .release(vestingInfo.lastScheduleId.sub(new anchor.BN(1)))
        .accounts({
          user: user.publicKey,
          mint: mint,
        })
        .signers([user])
        .rpc();
    } catch (err) {
      error = err as anchor.AnchorError;
    }

    assert.equal(error.error.errorCode.code, "VestingFinished");
  });
});
