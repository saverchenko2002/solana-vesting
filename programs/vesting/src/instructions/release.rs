use anchor_lang::prelude::*;
use anchor_spl::{
    token::Token,
    token_interface::{self, transfer_checked, Mint, TokenAccount},
};

use crate::{
    constants::*, errors::VestingError, events::VestingReleased,
    state::VestingSchedule, utils::calculate_release_amount,
};

#[derive(Accounts)]
#[instruction(schedule_id: u64)]
pub struct Release<'info> {
    pub user: Signer<'info>,

    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        seeds = [VESTING_SCHEDULE_SEED, &schedule_id.to_le_bytes(), user.key().as_ref()],
        bump,
    )]
    pub vesting_schedule: Box<Account<'info, VestingSchedule>>,

    #[account(mut,
        associated_token::mint = mint,
        associated_token::authority = user,
        associated_token::token_program = token_program)]
    pub user_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        seeds = [TREASURY_AUTHORITY_SEED],
        bump,
    )]
    /// CHECK
    pub treasury_authority: UncheckedAccount<'info>,

    #[account(mut,
        associated_token::mint = mint,
        associated_token::authority = treasury_authority,
        associated_token::token_program = token_program)]
    pub treasury: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

pub fn release(
    ctx: Context<Release>,
    _schedule_id: u64,
) -> Result<()> {
    let user = &ctx.accounts.user;

    let vesting_schedule = &mut ctx.accounts.vesting_schedule;

    require!(
        vesting_schedule.released < vesting_schedule.amount_total,
        VestingError::VestingFinished
    );

    let (release_amount, is_finished) = calculate_release_amount(
        vesting_schedule.amount_total,
        vesting_schedule.released,
        vesting_schedule.start_ts,
        vesting_schedule.duration,
        vesting_schedule.slice_period_seconds,
    )?;

    let bump = ctx.bumps.treasury_authority;
    let signer: &[&[&[u8]]] = &[&[TREASURY_AUTHORITY_SEED, &[bump]]];

    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token_interface::TransferChecked {
                from: ctx.accounts.treasury.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.user_ata.to_account_info(),
                authority: ctx.accounts.treasury_authority.to_account_info(),
            },
            signer,
        ),
        release_amount,
        ctx.accounts.mint.decimals,
    )?;

    vesting_schedule.released += release_amount;

    emit!(VestingReleased {
        amount: release_amount,
        destination: user.key(),
        released_ts: Clock::get().unwrap().unix_timestamp,
        is_finished
    });

    Ok(())
}
