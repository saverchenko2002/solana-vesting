use anchor_lang::prelude::*;

#[constant]
pub const ADMIN: Pubkey =
    pubkey!("CXJiiQhBgXYMpfyNHoWaVdSnbWJn2aHCd6tdoSnCJGWF");

#[constant]
pub const TREASURY_AUTHORITY_SEED: &[u8] = b"treasury_authority";

#[constant]
pub const VESTING_INFO_SEED: &[u8] = b"vesting_info";

#[constant]
pub const VESTING_SCHEDULE_SEED: &[u8] = b"vesting_schedule";
