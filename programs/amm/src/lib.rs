use anchor_lang::prelude::*;

pub mod account;
pub mod state;

use account::InitializePool;


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
}
