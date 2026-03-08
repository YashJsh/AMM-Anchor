import { Program } from "@coral-xyz/anchor";
import { Amm } from "../../target/types/amm";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

export const AddLiquidity = async (program: Program<Amm>, token_a: string, token_b: string, amount_a: number, amount_b: number, pool_pda: PublicKey, userLpAccount: PublicKey
) => {
    let pool_state = await program.account.pool.fetch(pool_pda);
    let token_amount_a = new BN(amount_a);
    let token_amount_b = new BN(amount_b);
    const [authPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("authority"), pool_pda.toBuffer()],
        program.programId
    );
    try {
        //Todo : We have to add the decimals here as well, according to the token decimal
        const tx = await program.methods.provideLiquidity(token_amount_a, token_amount_b).accounts({
            userTokenA: new PublicKey(token_a),
            userTokenB: new PublicKey(token_b),
            lpMint: pool_state.lpMint,
            userLpAccount: userLpAccount,
            vaultA: pool_state.vaultA,
            vaultB: pool_state.vaultB,
            authority: authPda,
            poolAccount: pool_pda,
        } as any).rpc()
        const updatedPool = await program.account.pool.fetch(pool_pda);
        return updatedPool;
    } catch (error) {
        console.error("Initialization failed:", error);
        throw error;
    }
}