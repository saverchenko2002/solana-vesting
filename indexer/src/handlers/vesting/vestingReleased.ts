import { DataHandlerContext } from "@subsquid/batch-processor";
import { Store } from "@subsquid/typeorm-store";
import { Block, LogMessage } from "@subsquid/solana-stream";
import { BigDecimal } from "@subsquid/big-decimal";

import { ReleaseEntry } from "../../model/generated/releaseEntry.model";

import * as vesting from "../../abi/vesting";
import { splTokenDecimals } from "../../constants";

export async function handle(
  ctx: DataHandlerContext<Block<{}>, Store>,
  block: Block<{}>,
  log: LogMessage<{}>
) {
  const vestingReleasedDecoded = vesting.events.VestingReleased.decodeData(
    Uint8Array.from(Buffer.from(log.message, "base64"))
  );

  const id = `VestingReleased-${vestingReleasedDecoded.scheduleId}-${vestingReleasedDecoded.releasedTs}`;

  const entity = new ReleaseEntry();

  entity.id = id;

  entity.amountReleased = BigDecimal(
    Number(vestingReleasedDecoded.amount) / splTokenDecimals
  );

  entity.destination = vestingReleasedDecoded.destination;
  entity.isFinished = vestingReleasedDecoded.isFinished;

  entity.timestamp = entity.timestamp = BigInt(block.header.timestamp) * 1000n;

  await ctx.store.insert(entity);
}
