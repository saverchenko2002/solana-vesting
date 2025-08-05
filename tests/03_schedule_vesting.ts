import * as anchor from "@coral-xyz/anchor";
import { Vesting } from "@target/types/vesting";

import { assert } from "chai";
import { PublicKey } from "@solana/web3.js";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getAccount,
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
} from "./00_setup_tests";

describe("Create Schedule Tests", async () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Vesting as anchor.Program<Vesting>;

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const [treasuryAuthorityAddress, _] = PublicKey.findProgramAddressSync(
    [Buffer.from(treasuryAuthoritySeed)],
    program.programId
  );

  it("should fail if non admin schedule vesting", async () => {
    const [vestingInfoAddress, _] = PublicKey.findProgramAddressSync(
      [Buffer.from(vestingInfoSeed)],
      program.programId
    );

    const vestingInfo = await program.account.vestingInfo.fetch(
      vestingInfoAddress
    );

    let error: anchor.AnchorError;

    try {
      await program.methods
        .schedule(
          vestingInfo.lastScheduleId,
          new anchor.BN(vestedAmount),
          new anchor.BN(duration),
          new anchor.BN(slicePeriodSeconds)
        )
        .accounts({
          admin: user.publicKey,
          user: user.publicKey,
          mint: mint,
        })
        .signers([user])
        .rpc();
    } catch (err) {
      error = err as anchor.AnchorError;
    }

    assert.equal(error.error.errorCode.code, "Unauthorized");
  });

  it("should fail if incorrect mint is provided", async () => {
    const [vestingInfoAddress, _] = PublicKey.findProgramAddressSync(
      [Buffer.from(vestingInfoSeed)],
      program.programId
    );

    const vestingInfo = await program.account.vestingInfo.fetch(
      vestingInfoAddress
    );

    let error: anchor.AnchorError;

    try {
      await program.methods
        .schedule(
          vestingInfo.lastScheduleId,
          new anchor.BN(vestedAmount),
          new anchor.BN(duration),
          new anchor.BN(slicePeriodSeconds)
        )
        .accounts({
          admin: admin.publicKey,
          user: user.publicKey,
          mint: fakeMint,
        })
        .signers([admin])
        .rpc();
    } catch (err) {
      error = err as anchor.AnchorError;
    }

    assert.equal(error.error.errorCode.code, "MintAuthorityFailed");
  });

  it("should fail if schedule over treasury capacity", async () => {
    const [vestingInfoAddress, _] = PublicKey.findProgramAddressSync(
      [Buffer.from(vestingInfoSeed)],
      program.programId
    );

    const vestingInfo = await program.account.vestingInfo.fetch(
      vestingInfoAddress
    );

    let error: anchor.AnchorError;

    try {
      await program.methods
        .schedule(
          vestingInfo.lastScheduleId,
          new anchor.BN(2 * vestedAmount),
          new anchor.BN(duration),
          new anchor.BN(slicePeriodSeconds)
        )
        .accounts({
          admin: admin.publicKey,
          user: user.publicKey,
          mint: mint,
        })
        .signers([admin])
        .rpc();
    } catch (err) {
      error = err as anchor.AnchorError;
    }

    assert.equal(error.error.errorCode.code, "ScheduleAmountFailed");
  });

  it("should create vesting schedule", async () => {
    const [vestingInfoAddress, _] = PublicKey.findProgramAddressSync(
      [Buffer.from(vestingInfoSeed)],
      program.programId
    );

    const vestingInfoBefore = await program.account.vestingInfo.fetch(
      vestingInfoAddress
    );

    await program.methods
      .schedule(
        vestingInfoBefore.lastScheduleId,
        new anchor.BN(vestedAmount),
        new anchor.BN(duration),
        new anchor.BN(slicePeriodSeconds)
      )
      .accounts({
        admin: admin.publicKey,
        user: user.publicKey,
        mint: mint,
      })
      .signers([admin])
      .rpc();

    const [vestingScheduleAddress, bump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(vestingScheduleSeed),
        vestingInfoBefore.lastScheduleId.toArrayLike(Buffer, "le", 8),
        user.publicKey.toBuffer(),
      ],
      program.programId
    );

    const vestingSchedule = await program.account.vestingSchedule.fetch(
      vestingScheduleAddress
    );

    assert.equal(
      vestingSchedule.scheduleId.toNumber(),
      vestingInfoBefore.lastScheduleId.toNumber()
    );

    assert.equal(vestingSchedule.isInitialized, true);
    assert.equal(
      vestingSchedule.beneficiary.toBase58(),
      user.publicKey.toBase58()
    );

    assert.equal(vestingSchedule.duration.toNumber(), duration);
    assert.equal(
      vestingSchedule.slicePeriodSeconds.toNumber(),
      slicePeriodSeconds
    );

    assert.equal(vestingSchedule.amountTotal.toNumber(), vestedAmount);
    assert.equal(vestingSchedule.released.toNumber(), 0);
    assert.equal(vestingSchedule.bump, bump);

    const vestingInfoAfter = await program.account.vestingInfo.fetch(
      vestingInfoAddress
    );

    assert.equal(
      vestingInfoAfter.lastScheduleId.toNumber(),
      vestingInfoBefore.lastScheduleId.toNumber() + 1
    );

    assert.equal(vestingInfoAfter.amount.toNumber(), 0);

    const treasuryAtaAddress = getAssociatedTokenAddressSync(
      mint,
      treasuryAuthorityAddress,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const treasuryAccount = await getAccount(
      provider.connection,
      treasuryAtaAddress,
      undefined,
      TOKEN_PROGRAM_ID
    );

    assert.equal(Number(treasuryAccount.amount), mintAmount);

    const userAtaAddress = getAssociatedTokenAddressSync(
      mint,
      user.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const userAccount = await getAccount(
      provider.connection,
      userAtaAddress,
      undefined,
      TOKEN_PROGRAM_ID
    );

    assert.equal(Number(userAccount.amount), 0);
  });
});
