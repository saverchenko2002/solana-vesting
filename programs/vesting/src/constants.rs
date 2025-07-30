use anchor_lang::prelude::*;

#[constant]
pub const ADMIN: Pubkey =
    pubkey!("7k9JvtA9rbsWSbJc4q316TYPyrqmA4nvSYTnfaGig7Qr");

#[constant]
pub const TREASURY_AUTHORITY_SEED: &[u8] = b"treasury_authority";

#[constant]
pub const VESTING_INFO_SEED: &[u8] = b"vesting_info";

#[constant]
pub const VESTING_SCHEDULE_SEED: &[u8] = b"vesting_schedule";
