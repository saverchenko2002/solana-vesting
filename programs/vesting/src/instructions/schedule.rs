use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::Token,
    token_interface::{Mint, TokenAccount},
};

use crate::{
    constants::*,
    errors::VestingError,
    events::VestingScheduleInit,
    state::{VestingInfo, VestingSchedule},
};

#[derive(Accounts)]
#[instruction(schedule_id: u64)]
pub struct Schedule<'info> {
    #[account(mut, constraint = admin.key() == ADMIN @VestingError::Unauthorized)]
    pub admin: Signer<'info>,

    /// CHECK
    pub user: AccountInfo<'info>,

    #[account(
        mut,
        constraint = mint.mint_authority == Some(ADMIN).into() @VestingError::MintAuthorityFailed
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        init,
        payer=admin,
        seeds = [VESTING_SCHEDULE_SEED, &schedule_id.to_le_bytes(), user.key().as_ref()],
        bump,
        space = 8 + VestingSchedule::INIT_SPACE
    )]
    pub vesting_schedule: Box<Account<'info, VestingSchedule>>,
    #[account(
        init_if_needed,
        payer = admin,
        associated_token::mint = mint,
        associated_token::authority = user,
        associated_token::token_program = token_program,
    )]
    pub user_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [VESTING_INFO_SEED],
        bump,
    )]
    pub vesting_info_account: Box<Account<'info, VestingInfo>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn schedule(
    ctx: Context<Schedule>,
    schedule_id: u64,
    amount: u64,
    duration: u64,
    slice_period_seconds: u64,
) -> Result<()> {
    let user = &ctx.accounts.user;
    let admin = &ctx.accounts.admin;

    let vesting_info: &mut Box<Account<'_, VestingInfo>> =
        &mut ctx.accounts.vesting_info_account;
    let vesting_schedule = &mut ctx.accounts.vesting_schedule;

    require!(
        vesting_info.amount >= amount,
        VestingError::ScheduleAmountFailed
    );

    vesting_info.last_schedule_id += 1;
    vesting_info.amount -= amount;

    vesting_schedule.schedule_id = schedule_id;
    vesting_schedule.is_initialized = true;
    vesting_schedule.beneficiary = user.key();
    vesting_schedule.start_ts = Clock::get().unwrap().unix_timestamp;
    vesting_schedule.duration = duration;
    vesting_schedule.slice_period_seconds = slice_period_seconds;
    vesting_schedule.amount_total = amount;
    vesting_schedule.released = 0;
    vesting_schedule.bump = ctx.bumps.vesting_schedule;

    emit!(VestingScheduleInit {
        schedule_id: schedule_id,
        beneficiary: user.key(),
        start_ts: vesting_schedule.start_ts,
        duration: duration,
        slice_period_seconds: slice_period_seconds,
        amount_total: amount,
        initiator: admin.key(),
    });

    Ok(())
}
