import { DataHandlerContext } from "@subsquid/batch-processor";
import { Store } from "@subsquid/typeorm-store";
import { Block, LogMessage } from "@subsquid/solana-stream";

import { TreasuryInit } from "../../model/generated/treasuryInit.model";

import * as vesting from "../../abi/vesting";

export async function handle(
  ctx: DataHandlerContext<Block<{}>, Store>,
  block: Block<{}>,
  log: LogMessage<{}>
) {
  const treasuryInitDecoded = vesting.events.TreasuryInit.decodeData(
    Uint8Array.from(Buffer.from(log.message, "base64"))
  );

  const id = `Init-${block.header.timestamp * 1000}`;

  const entity = new TreasuryInit();

  entity.id = id;

  entity.init = treasuryInitDecoded.init;
  entity.mint = treasuryInitDecoded.mint;

  entity.timestamp = BigInt(block.header.timestamp) * 1000n;

  await ctx.store.insert(entity);
}
