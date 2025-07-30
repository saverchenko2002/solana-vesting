use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct VestingInfo {
    pub mint: Pubkey,
    pub amount: u64,
    pub created_at: i64,
    pub last_schedule_id: u64,
}
