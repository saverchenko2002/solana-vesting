use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::Token,
    token_interface::{Mint, TokenAccount},
};

use crate::{
    constants::*, errors::VestingError, events::TreasuryFill,
    state::VestingInfo, utils::mint_to,
};

#[derive(Accounts)]
pub struct TreasuryMint<'info> {
    #[account(mut, constraint = admin.key() == ADMIN @VestingError::Unauthorized)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        constraint = mint.mint_authority == Some(ADMIN).into() @VestingError::MintAuthorityFailed
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        init,
        payer = admin,
        seeds = [VESTING_INFO_SEED],
        bump,
        space = 8 + VestingInfo::INIT_SPACE,
    )]
    pub vesting_info_account: Box<Account<'info, VestingInfo>>,

    #[account(
        seeds = [TREASURY_AUTHORITY_SEED],
        bump,
    )]
    /// CHECK
    pub treasury_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = treasury_authority,
        associated_token::token_program = token_program,
    )]
    pub treasury: Box<InterfaceAccount<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn mint(
    ctx: Context<TreasuryMint>,
    amount: u64,
) -> Result<()> {
    let token_mint = &ctx.accounts.mint;
    let admin = &ctx.accounts.admin;
    let token_program = &ctx.accounts.token_program;
    let treasury = &ctx.accounts.treasury;

    let vesting_info = &mut ctx.accounts.vesting_info_account;

    mint_to(
        &token_mint.to_account_info(),
        &admin.to_account_info(),
        &token_program.to_account_info(),
        &treasury.to_account_info(),
        amount,
    )?;

    vesting_info.mint = ctx.accounts.mint.key();
    vesting_info.amount = amount;
    vesting_info.created_at = Clock::get().unwrap().unix_timestamp;
    vesting_info.last_schedule_id = 0;

    emit!(TreasuryFill {
        amount,
        fill_at: vesting_info.created_at
    });

    Ok(())
}
