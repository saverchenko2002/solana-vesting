import { DataHandlerContext } from "@subsquid/batch-processor";
import { Store } from "@subsquid/typeorm-store";
import { Block, LogMessage } from "@subsquid/solana-stream";
import { BigDecimal } from "@subsquid/big-decimal";

import { VestingSchedule } from "../../model/generated/vestingSchedule.model";

import * as vesting from "../../abi/vesting";
import { splTokenDecimals } from "../../constants";

export async function handle(
  ctx: DataHandlerContext<Block<{}>, Store>,
  block: Block<{}>,
  log: LogMessage<{}>
) {
  const vestingScheduleInitDecoded =
    vesting.events.VestingScheduleInit.decodeData(
      Uint8Array.from(Buffer.from(log.message, "base64"))
    );

  const id = `VestingScheduleInit-${vestingScheduleInitDecoded.scheduleId}-${vestingScheduleInitDecoded.startTs}`;

  const entity = new VestingSchedule();

  entity.id = id;

  entity.amountTotal = BigDecimal(
    Number(vestingScheduleInitDecoded.amountTotal) / splTokenDecimals
  );

  entity.beneficiary = vestingScheduleInitDecoded.beneficiary;
  entity.duration = vestingScheduleInitDecoded.duration;
  entity.slicePeriodSeconds = vestingScheduleInitDecoded.slicePeriodSeconds;
  entity.duration = vestingScheduleInitDecoded.duration;
  entity.startTs = vestingScheduleInitDecoded.startTs;

  entity.initiator = vestingScheduleInitDecoded.initiator;
  entity.timestamp = BigInt(block.header.timestamp) * 1000n;

  await ctx.store.insert(entity);
}
