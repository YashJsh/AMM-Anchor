use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid authority passed")]
    InvalidAuthority,

    #[msg("Same tokens are now allowed")]
    SimilarTokenError,

    #[msg("Invalid amount")]
    InvalidAmount,

    #[msg("Account doesn't match")]
    InvalidAccount,

    #[msg("Token's mint is not same as the pool's token")]
    DifferentTokenError,

    #[msg("Invalid lp amount calculated")]
    InvalidLpAmount,

    #[msg("Invalid mint account")]
    InvalidMintAccount,
}
