import { TREASURY_AUTHORITY_SEED } from "@client/constants";
import * as anchor from "@coral-xyz/anchor";
import IDL from "@target/idl/vesting.json";
import { Vesting } from "@target/types/vesting";

import { PublicKey, Transaction } from "@solana/web3.js";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

export interface InitializeConfig {
  mint: PublicKey;
}

export async function initializeVesting(
  config: InitializeConfig,
  amount: anchor.BN
) {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new anchor.Program<Vesting>(IDL, provider);

  const [treasuryAuthorityAddress, _] = PublicKey.findProgramAddressSync(
    [Buffer.from(TREASURY_AUTHORITY_SEED)],
    program.programId
  );

  const treasuryAddress = getAssociatedTokenAddressSync(
    config.mint,
    treasuryAuthorityAddress,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const args: [anchor.BN] = [amount];

  try {
    const ix1 = await program.methods
      .initialize()
      .accounts({
        admin: provider.wallet.publicKey,
        mint: config.mint,
      })
      .instruction();

    const ix2 = await program.methods
      .treasuryMint(...args)
      .accounts({
        admin: provider.wallet.publicKey,
        mint: config.mint,
      })
      .instruction();

    const tx = new Transaction().add(ix1).add(ix2);

    tx.recentBlockhash = (
      await provider.connection.getLatestBlockhash()
    ).blockhash;

    provider.sendAndConfirm(tx);

    console.log("Vesting initialized successfully!");
    console.log("Transaction signature:", tx);
    console.log(
      "Treasury authority address:",
      treasuryAuthorityAddress.toString()
    );
    console.log("Treasury address:", treasuryAddress.toString());
  } catch (err) {
    console.error("Error initializing vesting:", err);
  }
}

if (require.main === module) {
  const amountStr = process.argv[2];

  const mint = new PublicKey(process.env.MINT);
  const amount = new anchor.BN(amountStr);

  initializeVesting({ mint }, amount);
}
