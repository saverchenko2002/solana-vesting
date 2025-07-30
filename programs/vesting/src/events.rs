use anchor_lang::prelude::*;

#[event]
pub struct TreasuryInit {
    pub init: bool,
    pub mint: Pubkey,
}

#[event]
pub struct TreasuryFill {
    pub amount: u64,
    pub fill_at: i64,
}

#[event]
pub struct VestingScheduleInit {
    pub schedule_id: u64,
    pub beneficiary: Pubkey,
    pub start_ts: i64,
    pub duration: u64,
    pub slice_period_seconds: u64,
    pub amount_total: u64,
}

#[event]
pub struct VestingReleased {
    pub amount: u64,
    pub destination: Pubkey,
    pub released_ts: i64,
    pub is_finished: bool,
}
