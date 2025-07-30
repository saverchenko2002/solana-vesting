use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct VestingSchedule {
    pub is_initialized: bool,
    pub schedule_id: u64,
    pub beneficiary: Pubkey,
    pub start_ts: i64,
    pub duration: u64,
    pub slice_period_seconds: u64,
    pub amount_total: u64,
    pub released: u64,
    pub bump: u8,
}
