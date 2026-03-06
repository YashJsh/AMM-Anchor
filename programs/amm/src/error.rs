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

    #[msg("Invalid Account Recieved")]
    InvalidTokenAccount,

    #[msg("Amount is less than min_amount")]
    MinAmountError,

    #[msg("Amount_out is greater than reserve balance")]
    AmountGreaterError,

    #[msg("Math overflow occurred")]
    MathOverflow,

    #[msg("Pool account has nothing")]
    InvalidPoolState
}
