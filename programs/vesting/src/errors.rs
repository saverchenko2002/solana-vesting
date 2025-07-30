use anchor_lang::prelude::*;

#[error_code]
pub enum VestingError {
    #[msg("Caller must be admin")]
    Unauthorized,

    #[msg("Mint authority failed")]
    MintAuthorityFailed,

    #[msg("Treasury amount exceeded")]
    ScheduleAmountFailed,

    #[msg("No tokens available for release")]
    NothingToRelease,

    #[msg("Current vesting schedule already finished")]
    VestingFinished,
}
