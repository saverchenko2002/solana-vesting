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
  treasuryAuthoritySeed,
} from "./00_setup_tests";

describe("Create Init Tests", async () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Vesting as anchor.Program<Vesting>;

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const [treasuryAuthorityAddress, _] = PublicKey.findProgramAddressSync(
    [Buffer.from(treasuryAuthoritySeed)],
    program.programId
  );

  before(async () => {});

  it("should fail if non admin initialize treasury", async () => {
    let error: anchor.AnchorError;

    try {
      await program.methods
        .initialize()
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

    try {
      await program.methods
        .initialize()
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

  it("should init the contract", async () => {
    await program.methods
      .initialize()
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

    const account = await getAccount(
      provider.connection,
      treasuryAtaAddress,
      undefined,
      TOKEN_PROGRAM_ID
    );

    assert.ok(account);
    assert.equal(account.owner.toBase58(), treasuryAuthorityAddress.toBase58());
    assert.equal(account.mint.toBase58(), mint.toBase58());
  });
});
