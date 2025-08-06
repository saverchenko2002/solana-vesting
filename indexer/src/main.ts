import { run } from "@subsquid/batch-processor";
import { augmentBlock } from "@subsquid/solana-objects";
import { DataSourceBuilder, SolanaRpcClient } from "@subsquid/solana-stream";
import { TypeormDatabase } from "@subsquid/typeorm-store";
import * as vesting from "./abi/vesting";
import { dispatchLog } from "./dispatchers";

const dataSource = new DataSourceBuilder()
  .setRpc({
    client: new SolanaRpcClient({
      url: "http://127.0.0.1:8899",
      rateLimit: 100,
    }),
    strideConcurrency: 10,
  })
  .setBlockRange({ from: 0 })
  .setFields({
    block: {
      timestamp: true,
    },
    instruction: {
      accounts: true,
      data: true,
    },
  })
  .addLog({
    where: {
      programId: [vesting.programId],
      kind: ["data"],
    },
    include: {
      instruction: true,
    },
    range: {
      from: 0,
    },
  })
  .addInstruction({
    where: {
      programId: [vesting.programId],
      d8: [vesting.instructions.initialize.d8],
      isCommitted: true,
    },
    include: {
      innerInstructions: true,
      transaction: true,
    },
  })

  .addInstruction({
    where: {
      programId: [vesting.programId],
      d8: [vesting.instructions.treasuryMint.d8],
      isCommitted: true,
    },
  })
  .addInstruction({
    where: {
      programId: [vesting.programId],
      d8: [vesting.instructions.schedule.d8],
      isCommitted: true,
    },
  })
  .addInstruction({
    where: {
      programId: [vesting.programId],
      d8: [vesting.instructions.release.d8],
      isCommitted: true,
    },
  })
  .build();

const database = new TypeormDatabase();

run(dataSource, database, async (ctx) => {
  let blocks = ctx.blocks.map(augmentBlock);

  for (let block of blocks) {
    for (let log of block.logs) {
      dispatchLog(ctx, block, log, log.instruction?.d8);
    }
  }
});
