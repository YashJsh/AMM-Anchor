use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Pool{
    pub authority : Pubkey,
    pub authority_bump : u8,

    pub token_a : Pubkey,
    pub token_b : Pubkey,

    pub lp_mint : Pubkey,
    pub lp_mint_bump : u8,

    pub fee : u8,

    pub vault_a : Pubkey,
    pub vault_b : Pubkey,

    pub reserve_a : u64,
    pub reserve_b : u64,
    
}


