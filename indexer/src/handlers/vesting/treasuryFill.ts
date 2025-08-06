import { DataHandlerContext } from "@subsquid/batch-processor";
import { Store } from "@subsquid/typeorm-store";
import { Block, LogMessage } from "@subsquid/solana-stream";
import { BigDecimal } from "@subsquid/big-decimal";

import { TreasuryFill } from "../../model/generated/treasuryFill.model";

import * as vesting from "../../abi/vesting";
import { splTokenDecimals } from "../../constants";

export async function handle(
  ctx: DataHandlerContext<Block<{}>, Store>,
  block: Block<{}>,
  log: LogMessage<{}>
) {
  const treasuryFillDecoded = vesting.events.TreasuryFill.decodeData(
    Uint8Array.from(Buffer.from(log.message, "base64"))
  );

  const id = `Fill-${block.header.timestamp * 1000}`;

  const entity = new TreasuryFill();

  entity.id = id;

  entity.amount = BigDecimal(
    Number(treasuryFillDecoded.amount) / splTokenDecimals
  );

  entity.fillAt = BigInt(block.header.timestamp) * 1000n;

  await ctx.store.insert(entity);
}
