use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};

use crate::state::Pool;

#[derive(Accounts)]
pub struct InitializePool<'info>{
    #[account(mut)]
    pub payer : Signer<'info>,

    #[account(
        init, 
        payer = payer,
        space = 8 + Pool::INIT_SPACE,
        seeds = [b"pool", token_a.key().as_ref(), token_b.key().as_ref()],
        bump
    )]
    pub pool_account : Account<'info, Pool>,

    #[account(
        seeds = [b"authority", pool_account.key().as_ref()],
        bump
    )]
    pub authority : UncheckedAccount<'info>,

    #[account(
        init,
        payer = payer,
        seeds = [b"token_a_vault", pool_account.key().as_ref(), token_a.key().as_ref()],
        bump,
        token::mint = token_a,
        token::authority = authority
    )]
    pub vault_token_A : Account<'info, TokenAccount>,

    #[account(
        init,
        payer = payer,
        seeds = [b"token_b_vault", pool_account.key().as_ref(), token_b.key().as_ref()],
        bump,
        token::mint = token_b,
        token::authority = authority
    )]
    pub vault_token_B : Account<'info, TokenAccount>,

    #[account(
        init,
        payer = payer,
        seeds = [b"lp_mint", pool_account.key().as_ref()],
        bump,
        mint::decimals = 6,
        mint::authority = authority
    )]
    pub lp_mint: Account<'info, Mint>,


    pub token_a : Account<'info, Mint>,
    pub token_b : Account<'info, Mint>,

    pub system_program : Program<'info, System>
}
