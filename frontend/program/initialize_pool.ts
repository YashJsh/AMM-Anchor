import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Amm } from "../../target/types/amm";
import { PROGRAM_ID } from "@/utils/program_id";

export const InitializePool = async (program: Program<Amm>, tokenAMint: string, tokenBMint: string, fee: number) => {
    let [pool_pda] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool"),
            new PublicKey(tokenAMint).toBuffer(),
            new PublicKey(tokenBMint).toBuffer()
        ],
        PROGRAM_ID
    );
    try {   
        const tx = await program.methods.initialize(fee).accounts({
            poolAccount: pool_pda,
            tokenA: tokenAMint,
            tokenB: tokenBMint,
        } as any).rpc();
        let pool_state = await program.account.pool.fetch(pool_pda);
        console.log("Transaction Signature for initalizing the pool is : ", tx);
        console.log("Pool_state Initialized : ", pool_state);
        return pool_pda;
    } catch (error) {
        console.error("Initialization failed:", error);
        throw error;
    }

}