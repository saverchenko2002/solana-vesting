use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::Token,
    token_interface::{Mint, TokenAccount},
};

use crate::{constants::*, errors::VestingError, events::TreasuryInit};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut, constraint = admin.key() == ADMIN @VestingError::Unauthorized)]
    pub admin: Signer<'info>,

    #[account(
        constraint = mint.mint_authority == Some(ADMIN).into() @VestingError::MintAuthorityFailed
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        seeds = [TREASURY_AUTHORITY_SEED],
        bump,
    )]
    /// CHECK
    pub treasury_authority: UncheckedAccount<'info>,

    #[account(
        init,
        payer = admin,
        associated_token::mint = mint,
        associated_token::authority = treasury_authority,
        associated_token::token_program = token_program,
    )]
    pub treasury: Box<InterfaceAccount<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let mint = &ctx.accounts.mint;

    emit!(TreasuryInit {
        init: true,
        mint: mint.key()
    });

    Ok(())
}
