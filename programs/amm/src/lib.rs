pub mod account_context;
pub mod error;
pub mod helper;
pub mod state;

use crate::account_context::*;
use crate::error::ErrorCode;
use crate::helper::calculate_remove_share;
use anchor_spl::token::{self, burn, Burn, Transfer};
use anchor_spl::token::MintTo;

use anchor_lang::prelude::*;

declare_id!("3wsk1NGSwh77rXU3Pd5umqexMp5Qy2q31wt7QJB8pCis");

#[program]
pub mod amm {
    use crate::helper::calculate_swap;

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
            match helper::calculate_lp(
                accepted_a,
                accepted_b,
                pool.reserve_a,
                pool.reserve_b,
                total_supply,
            ) {
                Ok(amount) => lp_amount = amount,
                Err(_) => return Err(ErrorCode::InvalidLpAmount.into()),
            }
        } else {
            match helper::calculate_lp(
                accepted_a,
                accepted_b,
                pool.reserve_a,
                pool.reserve_b,
                total_supply,
            ) {
                Ok(amount) => lp_amount = amount,
                Err(_) => return Err(ErrorCode::InvalidLpAmount.into()),
            }
        }

        require!(lp_amount > 0, ErrorCode::InvalidLpAmount);

        //Once we find the lp amount, we have to mint these no. of lp to the user's account.
        let cpi_account = MintTo {
            mint: ctx.accounts.lp_mint.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
            to: ctx.accounts.user_lp_account.to_account_info(),
        };

        //Now we have to create a context.
        // let signer_seeds = [b"authority", pool.key().as_ref(), &[pool.authority_bump]]; This was not working
        let key = pool.key();
        let signer_seeds: &[&[u8]] = &[b"authority", key.as_ref(), &[pool.authority_bump]];
        let signer = &[signer_seeds];
        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_account,
            signer,
        );

        token::mint_to(cpi_context, lp_amount)?;

        //Now update the reserves.
        pool.reserve_a += accepted_a;
        pool.reserve_b += accepted_b;
        Ok(())
    }

    pub fn swap_token(ctx: Context<SwapToken>, amount: u64, min_out: u64) -> Result<()> {
        let pool_account = &mut ctx.accounts.pool_account;

        //Few checks to made
        //1. Check if the amount is not 0
        require!(amount > 0, ErrorCode::InvalidAmount);

        //2. Check if the mint mnatches the mint stored in pool.
        require!(
            ctx.accounts.user_input_token.mint == pool_account.token_a
                || ctx.accounts.user_input_token.mint == pool_account.token_b,
            ErrorCode::InvalidTokenAccount
        );
        require!(
            ctx.accounts.user_output_token.mint == pool_account.token_a
                || ctx.accounts.user_output_token.mint == pool_account.token_b,
            ErrorCode::InvalidTokenAccount
        );

        //4. Check for the authority pda.
        require!(
            pool_account.authority == ctx.accounts.authority.key(),
            ErrorCode::InvalidAuthority
        );

        //5. Check if the user_input and output_token are not same
        require!(
            ctx.accounts.user_input_token.mint != ctx.accounts.user_output_token.mint,
            ErrorCode::InvalidMintAccount
        );

        //6. Check the vault given matches the vault stored in the pool.
        require!(
            ctx.accounts.vault_a.key() == pool_account.vault_a,
            ErrorCode::InvalidAccount
        );
        require!(
            ctx.accounts.vault_b.key() == pool_account.vault_b,
            ErrorCode::InvalidAccount
        );

        // require!(ctx.accounts.user_input_token.mint == pool_account.vault_a || ctx.accounts.user_input_token.mint == pool_account.vault_b, ErrorCode::InvalidTokenAccount);

        //Check user is gettting the amount greated than min out.
        let (reserve_in, reserve_out, vault_in, vault_out);

        if ctx.accounts.user_input_token.mint == pool_account.token_a {
            reserve_in = pool_account.reserve_a;
            reserve_out = pool_account.reserve_b;
            vault_in = &ctx.accounts.vault_a;
            vault_out = &ctx.accounts.vault_b;
        } else {
            reserve_in = pool_account.reserve_b;
            reserve_out = pool_account.reserve_a;
            vault_in = &ctx.accounts.vault_b;
            vault_out = &ctx.accounts.vault_a;
        }
        let amount_in_with_fee = amount * (1000 - pool_account.fee as u64);

        let amount_out = calculate_swap(reserve_in, reserve_out, amount_in_with_fee)?;

        require!(amount_out >= min_out, ErrorCode::MinAmountError);
        require!(amount_out <= reserve_out, ErrorCode::AmountGreaterError);

        //Cpi the token to the vault;
        let accounts_token_to_vault = Transfer {
            authority: ctx.accounts.payer.to_account_info(),
            from: ctx.accounts.user_input_token.to_account_info(),
            to: vault_in.to_account_info(),
        };
        let transfer_to_vault_context = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            accounts_token_to_vault,
        );
        token::transfer(transfer_to_vault_context, amount)?;

        //Cpi the token to the user_token_account;
        let amount_to_user_account = Transfer {
            authority: ctx.accounts.authority.to_account_info(),
            from: vault_out.to_account_info(),
            to: ctx.accounts.user_output_token.to_account_info(),
        };

        
        let key = pool_account.key();
        let signer_seeds: &[&[u8]] = &[b"authority", key.as_ref(), &[pool_account.authority_bump]];
        let signer = &[signer_seeds];

        let amount_to_user_context = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            amount_to_user_account,
            signer,
        );

        token::transfer(amount_to_user_context, amount_out)?;

        //Update reserves;
        //Here how to update the correct reserver.and decrese the other reserve how?
        if ctx.accounts.user_input_token.mint == pool_account.token_a {
            //It means direction is a-> b
            pool_account.reserve_a += amount;
            pool_account.reserve_b -= amount_out;
        } else {
            pool_account.reserve_a -= amount_out;
            pool_account.reserve_b += amount;
        }

        Ok(())
    }

    pub fn remove_liquidity(ctx: Context<RemoveLiquidity>, lp_amount: u64) -> Result<()> {
        let pool_account = &mut ctx.accounts.pool_account;

        //Checks necessary
        //1. Are the user_token_mint matches the token mint stored in the pool.
        require!(
            ctx.accounts.user_token_a.mint == pool_account.token_a,
            ErrorCode::InvalidAccount
        );
        require!(
            ctx.accounts.user_token_b.mint == pool_account.token_b,
            ErrorCode::InvalidAccount
        );

        //2. Vault_a and vault_b matches the vault in pool
        require!(
            ctx.accounts.vault_a.key() == pool_account.vault_a,
            ErrorCode::InvalidAccount
        );
        require!(
            ctx.accounts.vault_b.key() == pool_account.vault_b,
            ErrorCode::InvalidAccount
        );

        //3. User token account are not same.
        require!(
            ctx.accounts.user_token_a.mint != ctx.accounts.user_token_b.mint,
            ErrorCode::InvalidAccount
        );

        //3. Lp mint are given
        require!(
            ctx.accounts.user_lp_account.mint == pool_account.lp_mint,
            ErrorCode::InvalidMintAccount
        );

        //4. Authority check, cause it is a unchecked account.
        require!(
            pool_account.authority == ctx.accounts.authority.key(),
            ErrorCode::InvalidAuthority
        );

        //5. Check if lp amount is greater than 0;
        require!(lp_amount > 0, ErrorCode::InvalidLpAmount);

        //6. Validate lp_mint account as well.
        require!(
            ctx.accounts.lp_mint.key() == pool_account.lp_mint,
            ErrorCode::InvalidMintAccount
        );

        //Check first that user has enough tokens in his lp account which he has mentioned
        require!(
            ctx.accounts.user_lp_account.amount >= lp_amount,
            ErrorCode::InvalidAmount
        );

        require!(
            pool_account.reserve_a > 0 && pool_account.reserve_b > 0,
            ErrorCode::InvalidPoolState
        );

        //We get the share of both tokens;
        let share = calculate_remove_share(
            pool_account.reserve_a,
            pool_account.reserve_b,
            lp_amount as u64,
            ctx.accounts.lp_mint.supply,
        )?;

        //Burn tokens.
        let burn_accounts = Burn {
            authority: ctx.accounts.payer.to_account_info(),
            from: ctx.accounts.user_lp_account.to_account_info(),
            mint: ctx.accounts.lp_mint.to_account_info(),
        };

        let burn_cpi_context =
            CpiContext::new(ctx.accounts.token_program.to_account_info(), burn_accounts);
            
        burn(burn_cpi_context, lp_amount)?;

        //We now want to deposit the token to the user account.
        let token_a_account = Transfer {
            authority: ctx.accounts.authority.to_account_info(),
            from: ctx.accounts.vault_a.to_account_info(),
            to: ctx.accounts.user_token_a.to_account_info(),
        };

        let key = pool_account.key();
        let signer_seeds: &[&[u8]] = &[b"authority", key.as_ref(), &[pool_account.authority_bump]];
        let signer = &[signer_seeds];
        let token_a_cpi_context = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token_a_account,
            signer,
        );

        token::transfer(token_a_cpi_context, share.share_a)?;
        let token_b_account = Transfer {
            authority: ctx.accounts.authority.to_account_info(),
            from: ctx.accounts.vault_b.to_account_info(),
            to: ctx.accounts.user_token_b.to_account_info(),
        };

        let token_b_cpi_context = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token_b_account,
            signer,
        );
        token::transfer(token_b_cpi_context, share.share_b)?;

        //After transfer is done. We update the resever.
        pool_account.reserve_a -= share.share_a;
        pool_account.reserve_b -= share.share_b;

        Ok(())
    }
}
