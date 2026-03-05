use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

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
    pub vault_token_a : Account<'info, TokenAccount>,

    #[account(
        init,
        payer = payer,
        seeds = [b"token_b_vault", pool_account.key().as_ref(), token_b.key().as_ref()],
        bump,
        token::mint = token_b,
        token::authority = authority
    )]
    pub vault_token_b : Account<'info, TokenAccount>,

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

    pub token_program: Program<'info, Token>,
    pub system_program : Program<'info, System>
}



#[derive(Accounts)]
pub struct AddLiquidity<'info>{
    #[account(mut)]
    pub payer : Signer<'info>,

    //Main pool account
    #[account(
        mut,
        seeds = [b"pool", pool_account.token_a.key().as_ref(), pool_account.token_b.key().as_ref()],
        bump
    )]
    pub pool_account : Account<'info, Pool>,

    #[account(
        seeds = [b"authority", pool_account.key().as_ref()],
        bump = pool_account.authority_bump
    )]
    pub authority: UncheckedAccount<'info>,

    //Vault for storing token A
    #[account(
        mut,
        address = pool_account.vault_a.key()
    )]
    pub vault_a : Account<'info, TokenAccount>,

    //Vault for storing token B
    #[account(
        mut,
        address = pool_account.vault_b.key()
    )]
    pub vault_b : Account<'info, TokenAccount>,

    //Lp mint, from here user will get the token lp.
    #[account(
        mut,    
        address = pool_account.lp_mint.key()
    )]
    pub lp_mint : Account<'info, Mint>,

    //Both token accounts for trnasfering the token to the vault.
    #[account(
        mut
    )]
    pub user_token_a : Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_token_b : Account<'info, TokenAccount>,

    //User will give us the lp account -> in which we will give his lp tokens
    #[account(
        mut,
    )]
    pub user_lp_account : Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}   

#[derive(Accounts)]
pub struct GetQuote<'info>{
    #[account(mut)]
    pub payer : Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"pool", pool_account.token_a.key().as_ref(), pool_account.token_b.key().as_ref()],
        bump
    )]
    pub pool_account : Account<'info, Pool>,

}


#[derive(Accounts)]
pub struct SwapToken<'info>{
    #[account(mut)]
    pub payer : Signer<'info>, 

    #[account(
        seeds = [b"authority", pool_account.key().as_ref()],
        bump = pool_account.authority_bump
    )]
    pub authority : UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"pool", pool_account.token_a.key().as_ref(), pool_account.token_b.key().as_ref()],
        bump
    )]
    pub pool_account : Account<'info, Pool>,

    //Vault A-> for sending the token a in vault of pool
    #[account(
        mut,
        address = pool_account.vault_a.key(),
        constraint = pool_account.token_a == vault_a.mint
    )]
    pub vault_a : Account<'info, TokenAccount>,


    //Vault B -> For giving the user token
    #[account(
        mut,
        address = pool_account.vault_b.key(),
        constraint = pool_account.vault_b == vault_b.mint
    )]
    pub vault_b : Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_input_token : Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_output_token : Account<'info, TokenAccount>,

    pub token_program : Program<'info, Token>
}

#[derive(Accounts)]
pub struct RemoveLiquidity<'info>{
    #[account(mut)]
    pub payer : Signer<'info>
}