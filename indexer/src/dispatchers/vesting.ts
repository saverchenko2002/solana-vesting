import * as vesting from "../abi/vesting";
import { DataHandlerContext } from "@subsquid/batch-processor";
import { Store } from "@subsquid/typeorm-store";
import { Block, LogMessage } from "@subsquid/solana-stream";

import * as treasuryInitHandler from "../handlers/vesting/treasuryInit";
import * as treasuryFillHandler from "../handlers/vesting/treasuryFill";
import * as vestingScheduleInitHandler from "../handlers/vesting/vestingScheduleInit";
import * as vestingReleasedHandler from "../handlers/vesting/vestingReleased";

export async function handleLog(
  ctx: DataHandlerContext<Block<{}>, Store>,
  block: Block<{}>,
  log: LogMessage<{}>,
  d8: string | undefined
) {
  switch (d8) {
    case vesting.instructions.initialize.d8:
      await treasuryInitHandler.handle(ctx, block, log);
      break;
    case vesting.instructions.schedule.d8:
      await vestingScheduleInitHandler.handle(ctx, block, log);
      break;
    case vesting.instructions.release.d8:
      await vestingReleasedHandler.handle(ctx, block, log);
      break;
    case vesting.instructions.treasuryMint.d8:
      await treasuryFillHandler.handle(ctx, block, log);
      break;
    default:
      break;
  }
}
