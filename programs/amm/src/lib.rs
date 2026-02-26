use anchor_lang::prelude::*;

pub mod accounts;
pub mod state;
pub mod helper;

use accounts::{AddLiquidity, InitializePool}


declare_id!("HPEyUjDjeFVwGaetxFgq1qz9Wcq2dpGBnshPMXc6v8x9");

#[program]
pub mod amm {
    use super::*;

    pub fn initialize(ctx: Context<InitializePool> , fee : u8) -> Result<()> {
        let pool = &mut ctx.accounts.pool_account;
        //Find the pda for the authority:
        let pda_authority = Pubkey::find_program_address(&[b"authority", pool.key().as_ref()], ctx.program_id);
        
        pool.authority = pda_authority.0;
        pool.authority_bump = pda_authority.1;

        pool.token_a = ctx.accounts.token_a.key();
        pool.token_b = ctx.accounts.token_b.key();

        pool.fee = fee;

        pool.lp_mint = ctx.accounts.lp_mint.key();
        pool.lp_mint_bump = ctx.bumps.lp_mint;

        pool.vault_a = ctx.accounts.vault_token_A.key();
        pool.vault_b = ctx.accounts.vault_token_B.key();

        pool.reserve_a = 0;
        pool.reserve_b = 0;

        Ok(())
    }

    pub fn provide_liquidity(ctx: Context<AddLiquidity>, token_a_amount : u64, token_b_amount : u64) -> Result<()>{
        let pool = &mut ctx.accounts.pool_account;
        
        //Check for the authority:
        require!(pool.authority == ctx.accounts.authority.key(), ErrorCode::InvalidAuthority);

        //Check first, token_a != token_b
        require!(ctx.accounts.user_token_a.key() != ctx.accounts.user_token_b.key(), ErrorCode::SimilarTokenError);

        //Check for the amount;
        require!(token_a_amount > 0 && token_b_amount > 0, ErrorCode::InvalidAmount);

        //Validate all the keys;
        require!(pool.lp_mint == ctx.accounts.lp_mint.key(), ErrorCode::InvalidAccount);
        require!(pool.vault_a == ctx.accounts.vault_a.key() && pool.vault_b == ctx.accounts.vault_b.key(), ErrorCode::InvalidAccount);

        //Transfer from user account to vault accounts;
        let cpi_account = Transfer{
            from : ctx.accounts.user_token_a.to_account_info(),
            to : ctx.accounts.vault_a.to_account_info(),
            authority : ctx.accounts.authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_account);

        token::transfer(cpi_ctx, token_a_amount);

        let cpi_account = Transfer{
            from : ctx.accounts.user_token_b.to_account_info(),
            to : ctx.accounts.vault_b.to_account_info(),
            authority : ctx.accounts.authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_account);

        token::transfer(cpi_ctx, token_b_amount);

        //Transfer done. 
        
        //Calculate the lp : 
        //Check if it the first lp:
        if pool.reserve_a == 0 && pool.reserve_b == 0{
            let lp_amount = helper::first_lp(token_a_amount, token_b_amount);
            
        }


        


        //Now update the reserves.
        pool.reserve_a += token_a_amount;
        pool.reserve_b += token_b_amount;


        Ok(())
    }
}


#[error_code]
pub enum ErrorCode{
    #[msg("Invalid authority passed")]
    InvalidAuthority,

    #[msg("Same tokens are now allowed")]
    SimilarTokenError,

    #[msg("Invalid amount")]
    InvalidAmount,

    #[msg("Account doesn't match")]
    InvalidAccount
}