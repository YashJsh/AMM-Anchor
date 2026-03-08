import { PublicKey } from "@solana/web3.js";
import { Amm } from "../../target/types/amm";
import { Program } from "@coral-xyz/anchor/dist/cjs/program";
import BN from "bn.js";

export const removeLiquidity = async (program: Program<Amm>, lp_Amount: number, token_a: string, token_b: string, pool_pda: PublicKey, userLpAccount: PublicKey) => {
    const pool_state = await program.account.pool.fetch(pool_pda);
    const [authPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("authority"), pool_pda.toBuffer()],
        program.programId
    );
    try {
        const tx = await program.methods.removeLiquidity(new BN(lp_Amount)).accounts({
            lpMint: pool_state.lpMint,
            userLpAccount: userLpAccount,
            vaultA: pool_state.vaultA,
            vaultB: pool_state.vaultB,
            userTokenA: new PublicKey(token_a),
            userTokenB: new PublicKey(token_b),
            authority: authPda,
            poolAccount: pool_pda
        } as any).rpc();

        console.log("Transaction signature : ", tx);
        return tx;
    } catch (error) {
        console.log("Transaction Failed", error);
        throw error;
    }
}   