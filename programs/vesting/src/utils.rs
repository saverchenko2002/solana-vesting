use anchor_lang::prelude::*;
use anchor_spl::token::{self, MintTo};

use crate::errors::VestingError;

pub fn calculate_release_amount(
    amount_total: u64,
    released: u64,
    start_ts: i64,
    duration: u64,
    slice_period_seconds: u64,
) -> Result<(u64, bool)> {
    let current_ts = Clock::get().unwrap().unix_timestamp;
    let elapsed_time = (current_ts - start_ts) as u64;
    let effective_time = elapsed_time.min(duration);

    let num_slices = effective_time / slice_period_seconds;

    let vested_amount = (amount_total as u128)
        .checked_mul(num_slices as u128)
        .unwrap()
        .checked_mul(slice_period_seconds as u128)
        .unwrap()
        .checked_div(duration as u128)
        .unwrap() as u64;

    msg!(&vested_amount.to_string());

    if vested_amount <= released {
        return Err(VestingError::NothingToRelease.into());
    }

    Ok((vested_amount - released, vested_amount == amount_total))
}

pub fn mint_to<'info>(
    mint: &AccountInfo<'info>,
    mint_authority: &AccountInfo<'info>,
    token_program: &AccountInfo<'info>,
    to: &AccountInfo<'info>,
    amount: u64,
) -> Result<()> {
    let cpi_ctx = CpiContext::new(
        token_program.clone(),
        MintTo {
            mint: mint.clone(),
            to: to.clone(),
            authority: mint_authority.clone(),
        },
    );

    token::mint_to(cpi_ctx, amount)
}
