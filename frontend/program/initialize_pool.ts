import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Amm } from "../../target/types/amm";
import { PROGRAM_ID } from "@/utils/program_id";
import { WalletContextState } from "@solana/wallet-adapter-react";

export const InitializePool = async (program: Program<Amm>, tokenAMint: string, tokenBMint: string, fee: number, wallet: WalletContextState) => {
    const mintA = new PublicKey(tokenAMint);
    const mintB = new PublicKey(tokenBMint);
    console.log("Program Id is : ", program.programId.toBase58());
    // deterministic ordering           
    const [token0, token1] =
        mintA.toBuffer().compare(mintB.toBuffer()) < 0
            ? [mintA, mintB]
            : [mintB, mintA];

    let [pool_pda] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool"),
            token0.toBuffer(),
            token1.toBuffer()
        ],
        PROGRAM_ID
    );
    try {
        const pool = await program.account.pool.fetchNullable(pool_pda);

        if (pool) {
            console.log("Pool already exists:", pool_pda.toBase58());
            return pool_pda;
        };
        
        const tx = await program.methods.initialize(fee).accounts({
            poolAccount: pool_pda,
            tokenA: token0,
            tokenB: token1,
            payer: wallet.publicKey
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