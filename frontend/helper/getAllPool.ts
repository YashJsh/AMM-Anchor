import { BN, Program } from "@coral-xyz/anchor"
import { Amm } from "../../target/types/amm"
import { Connection, PublicKey } from "@solana/web3.js"
import { getMint } from "@solana/spl-token"

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

export interface PoolWithNeededMetaData {
    publicKey: PublicKey,
    tokenA: PublicKey,
    tokenB: PublicKey,
    tokenAsymbol: string;
    tokenBsymbol: string;
    tokenAlogo: string
    tokenBlogo: string;
    reserveA: BN;
    reserveB: BN;
    fee: number;
    lpMint: PublicKey,
    tokenADecimal : number,
    tokenBDecimal : number
}

export const getPoolsWithNeededMetadata = async (program: Program<Amm>, connection: Connection, allTokenMetaData: Map<string, any>): Promise<PoolWithNeededMetaData[]> => {
    const pool: PoolInfo[] = await program.account.pool.all();
    return await Promise.all(
        pool.map(async (poolInfo) => {
            const tokenAMeta =
                allTokenMetaData.get(poolInfo.account.tokenA.toBase58()) ?? {
                    symbol: poolInfo.account.tokenA.toBase58().slice(0, 4),
                    logoURI: ""
                };

            const tokenBMeta =
                allTokenMetaData.get(poolInfo.account.tokenB.toBase58()) ?? {
                    symbol: poolInfo.account.tokenB.toBase58().slice(0, 4),
                    logoURI: ""
                };
            let tokenADecimals = tokenAMeta?.decimals
            let tokenBDecimals = tokenBMeta?.decimals

            if (!tokenADecimals) {
                const mint = await getMint(connection, poolInfo.account.tokenA)
                tokenADecimals = mint.decimals
            }

            if (!tokenBDecimals) {
                const mint = await getMint(connection, poolInfo.account.tokenB)
                tokenBDecimals = mint.decimals
            }


            return {
                publicKey: poolInfo.publicKey,
                tokenA: poolInfo.account.tokenA,
                tokenB: poolInfo.account.tokenB,
                tokenAsymbol: tokenAMeta?.symbol ?? "UNK",
                tokenBsymbol: tokenBMeta?.symbol ?? "UNK",
                tokenAlogo: tokenAMeta?.logoURI ?? "",
                tokenBlogo: tokenBMeta?.logoURI ?? "",
                reserveA: poolInfo.account.reserveA,
                reserveB: poolInfo.account.reserveB,
                fee: poolInfo.account.fee,
                lpMint: poolInfo.account.lpMint,
                tokenADecimal : tokenADecimals,
                tokenBDecimal : tokenBDecimals
            }

        })
    )
}