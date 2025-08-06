import { PublicKey } from "@solana/web3.js";
import { DataHandlerContext } from "@subsquid/batch-processor";
import { Store } from "@subsquid/typeorm-store";
import { Block, LogMessage } from "@subsquid/solana-stream";
import * as vestingDispatcher from "./vesting";

const VESTING_ID = new PublicKey(
  "F83VEf8HQhgbKgmQqe1LdDQK6UU59pKB3YRcL3UQMBNc"
);

export async function dispatchLog(
  ctx: DataHandlerContext<Block<{}>, Store>,
  block: Block<{}>,
  log: LogMessage<{}>,
  d8: string | undefined
) {
  if (log.programId == VESTING_ID.toBase58()) {
    await vestingDispatcher.handleLog(ctx, block, log, d8);
  }
}
