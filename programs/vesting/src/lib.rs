#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

declare_id!("F83VEf8HQhgbKgmQqe1LdDQK6UU59pKB3YRcL3UQMBNc");

pub mod constants;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;
pub mod utils;

use crate::instructions::*;

#[program]
pub mod vesting {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize(ctx)
    }

    pub fn treasury_mint(
        ctx: Context<TreasuryMint>,
        amount: u64,
    ) -> Result<()> {
        instructions::mint(ctx, amount)
    }

    pub fn schedule(
        ctx: Context<Schedule>,
        schedule_id: u64,
        amount: u64,
        duration: u64,
        slice_period_seconds: u64,
    ) -> Result<()> {
        instructions::schedule(
            ctx,
            schedule_id,
            amount,
            duration,
            slice_period_seconds,
        )
    }

    pub fn release(
        ctx: Context<Release>,
        schedule_id: u64,
    ) -> Result<()> {
        instructions::release(ctx, schedule_id)
    }
}
