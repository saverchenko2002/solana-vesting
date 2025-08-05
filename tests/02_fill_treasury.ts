import * as anchor from "@coral-xyz/anchor";
import { Vesting } from "@target/types/vesting";

import { assert } from "chai";
import { PublicKey } from "@solana/web3.js";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getAccount,
  createAssociatedTokenAccount,
} from "@solana/spl-token";

import {
  admin,
  user,
  mint,
  fakeMint,
  mintAmount,
  treasuryAuthoritySeed,
  vestingInfoSeed,
} from "./00_setup_tests";

describe("Create Fill Tests", async () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Vesting as anchor.Program<Vesting>;

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const [treasuryAuthorityAddress, _] = PublicKey.findProgramAddressSync(
    [Buffer.from(treasuryAuthoritySeed)],
    program.programId
  );

  it("should fail if non admin fill vesting treasury", async () => {
    let error: anchor.AnchorError;

    try {
      await program.methods
        .treasuryMint(new anchor.BN(mintAmount))
        .accounts({
          admin: user.publicKey,
          mint: mint,
        })
        .signers([user])
        .rpc();
    } catch (err) {
      error = err as anchor.AnchorError;
    }

    assert.equal(error.error.errorCode.code, "Unauthorized");
  });

  it("should fail if incorrect mint is provided for treasury", async () => {
    let error: anchor.AnchorError;

    /// to prevent solana runtime error for non existing ATA
    await createAssociatedTokenAccount(
      provider.connection,
      admin,
      fakeMint,
      treasuryAuthorityAddress,
      undefined,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
      true
    );

    try {
      await program.methods
        .treasuryMint(new anchor.BN(mintAmount))
        .accounts({
          admin: admin.publicKey,
          mint: fakeMint,
        })
        .signers([admin])
        .rpc();
    } catch (err) {
      error = err as anchor.AnchorError;
    }

    assert.equal(error.error.errorCode.code, "MintAuthorityFailed");
  });

  it("should fill vesting treasury", async () => {
    await program.methods
      .treasuryMint(new anchor.BN(mintAmount))
      .accounts({
        admin: admin.publicKey,
        mint: mint,
      })
      .signers([admin])
      .rpc();

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

    const [vestingInfoAddress, _] = PublicKey.findProgramAddressSync(
      [Buffer.from(vestingInfoSeed)],
      program.programId
    );

    const vestingInfo = await program.account.vestingInfo.fetch(
      vestingInfoAddress
    );

    assert.equal(vestingInfo.amount.toNumber(), mintAmount);
    assert.equal(vestingInfo.mint.toBase58(), mint.toBase58());
    assert.equal(vestingInfo.lastScheduleId.toNumber(), 0);
  });
});
