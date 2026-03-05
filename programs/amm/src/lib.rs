use anchor_lang::prelude::*;

pub mod accounts;
pub mod helper;
pub mod state;
pub mod error;

use accounts::{AddLiquidity, InitializePool};
use error::ErrorCode;

declare_id!("HPEyUjDjeFVwGaetxFgq1qz9Wcq2dpGBnshPMXc6v8x9");

#[program]
pub mod amm {

    use anchor_spl::token;

    use super::*;

    pub fn initialize(ctx: Context<InitializePool>, fee: u8) -> Result<()> {
        let pool = &mut ctx.accounts.pool_account;
        //Find the pda for the authority:
        let pda_authority =
            Pubkey::find_program_address(&[b"authority", pool.key().as_ref()], ctx.program_id);

        pool.authority = pda_authority.0;
        pool.authority_bump = pda_authority.1;

        pool.token_a = ctx.accounts.token_a.key();
        pool.token_b = ctx.accounts.token_b.key();

        pool.fee = fee;

        pool.lp_mint = ctx.accounts.lp_mint.key();
        pool.lp_mint_bump = ctx.bumps.lp_mint;

        pool.vault_a = ctx.accounts.vault_token_a.key();
        pool.vault_b = ctx.accounts.vault_token_b.key();

        pool.reserve_a = 0;
        pool.reserve_b = 0;

        Ok(())
    }

    pub fn provide_liquidity(
        ctx: Context<AddLiquidity>,
        token_a_amount: u64,
        token_b_amount: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool_account;

        //Check for the authority:
        require!(
            pool.authority == ctx.accounts.authority.key(),
            ErrorCode::InvalidAuthority
        );

        //Check first, token_a mint != token_b mint
        require!(
            ctx.accounts.user_token_a.mint != ctx.accounts.user_token_b.mint,
            ErrorCode::SimilarTokenError
        );

        //Check that the token user is sending is equal to the token_a we have saved in the pool
        require!(
            ctx.accounts.user_token_a.mint == pool.token_a,
            ErrorCode::DifferentTokenError
        );
        require!(
            ctx.accounts.user_token_b.mint == pool.token_b,
            ErrorCode::DifferentTokenError
        );
        require!(
            ctx.accounts.lp_mint.key() == pool.lp_mint,
            ErrorCode::InvalidMintAccount
        );

        //Check for the amount;
        require!(
            token_a_amount > 0 && token_b_amount > 0,
            ErrorCode::InvalidAmount
        );

        //Validate all the keys;
        require!(
            pool.lp_mint == ctx.accounts.lp_mint.key(),
            ErrorCode::InvalidAccount
        );
        require!(
            pool.vault_a == ctx.accounts.vault_a.key()
                && pool.vault_b == ctx.accounts.vault_b.key(),
            ErrorCode::InvalidAccount
        );

        let mut accepted_a = 0;
        let mut accepted_b = 0;

        //If reserves are 0 skip
        if pool.reserve_a == 0 && pool.reserve_b == 0 {
            //Check that the user is providing liquidity in the ratio of 1:1
            accepted_a = token_a_amount;
            accepted_b = token_b_amount;
        } else {
            if token_a_amount * pool.reserve_b < token_b_amount * pool.reserve_a {
                //A is limiting
                accepted_a = token_a_amount;
                accepted_b = token_a_amount * pool.reserve_b / pool.reserve_a;
            } else {
                //B is limiting
                accepted_b = token_b_amount;
                accepted_a = token_b_amount * pool.reserve_a / pool.reserve_b;
            }
        }

        //If accepted is 0; throw error
        require!(accepted_a != 0 && accepted_b != 0, ErrorCode::InvalidAmount);

        //Transfer from user account to vault accounts;
        let cpi_account = Transfer {
            from: ctx.accounts.user_token_a.to_account_info(),
            to: ctx.accounts.vault_a.to_account_info(),
            authority: ctx.accounts.payer.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_account);

        token::transfer(cpi_ctx, accepted_a)?;

        let cpi_account = Transfer {
            from: ctx.accounts.user_token_b.to_account_info(),
            to: ctx.accounts.vault_b.to_account_info(),
            authority: ctx.accounts.payer.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_account);

        token::transfer(cpi_ctx, accepted_b)?;

        //Calculate the lp :
        //Check if it the first lp:
        let total_supply = ctx.accounts.lp_mint.supply;

        let mut lp_amount = 0;
        if pool.reserve_a == 0 && pool.reserve_b == 0 {
            lp_amount = helper::first_lp(accepted_a, accepted_b);
        } else {
            lp_amount = helper::calculate_lp(
                accepted_a,
                accepted_b,
                pool.reserve_a,
                pool.reserve_b,
                total_supply,
            );
        }

        require!(lp_amount > 0, ErrorCode::InvalidLpAmount);

        //Once we find the lp amount, we have to mint these no. of lp to the user's account.
        let cpi_account = MintTo {
            mint: ctx.accounts.lp_mint.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
            to: ctx.accounts.user_lp_account.to_account_info(),
        };

        //Now we have to create a context.
        let signer_seeds = [b"authority", pool.key().as_ref(), &[pool.authority_bump]];
        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_account,
            &[&signer_seeds],
        );

        token::mint_to(cpi_context, lp_amount)?;

        //Now update the reserves.
        pool.reserve_a += accepted_a;
        pool.reserve_b += accepted_b;
        Ok(())
    }
}

