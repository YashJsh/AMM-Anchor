import { BN, Program } from "@coral-xyz/anchor"
import { Amm } from "../../target/types/amm"
import { PublicKey } from "@solana/web3.js"

export interface PoolInfo {
  publicKey: PublicKey,  
  account: {
    tokenA: PublicKey,
    tokenB: PublicKey,
    vaultA: PublicKey,
    vaultB: PublicKey,
    lpMint: PublicKey,
    reserveA: BN,
    reserveB: BN,
    fee: number
  }
}

export interface PoolWithNeededMetaData{
    publicKey: PublicKey,   
    tokenA : string,
    tokenB : string,
    tokenAsymbol: string;
    tokenBsymbol : string;
    tokenAlogo : string
    tokenBlogo: string; 
    reserveA: BN;
    reserveB: BN;
    fee: number;
}

export const getPoolsWithNeededMetadata = async (program : Program<Amm>, allTokenMetaData: Map<string, any>): Promise<PoolWithNeededMetaData[]> => {

    const pool : PoolInfo[] = await program.account.pool.all();
    return pool.map((poolInfo)=> {
        const tokenAMint = poolInfo.account.tokenA.toString();
        const tokenBMint = poolInfo.account.tokenB.toString();

        const tokenAMeta = allTokenMetaData.get(tokenAMint);
        const tokenBMeta = allTokenMetaData.get(tokenBMint);

        return {
            publicKey: poolInfo.publicKey,   
            tokenA : tokenAMint,
            tokenB : tokenBMint,
            tokenAsymbol: tokenAMeta?.symbol ?? "UNK",
            tokenBsymbol: tokenBMeta?.symbol ?? "UNK",
            tokenAlogo: tokenAMeta?.logoURI ?? "",
            tokenBlogo: tokenBMeta?.logoURI ?? "",
            reserveA: poolInfo.account.reserveA,
            reserveB: poolInfo.account.reserveB,
            fee: poolInfo.account.fee
        }
    })
}