import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor/dist/cjs/program";
import { Amm } from "../../target/types/amm";
import BN from "bn.js";

export const swap_token = async (program: Program<Amm>, amount_in: number, min_out: number, pool_pda: PublicKey, user_input_token: string, user_output_token: string) => {
    try {
        const [authPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("authority"), pool_pda.toBuffer()],
            program.programId
        );
        const pool_state = await program.account.pool.fetch(pool_pda);
        const tx = await program.methods.swapToken(new BN(amount_in), new BN(min_out)).accounts({
            userInputToken: new PublicKey(user_input_token),
            userOutputToken: new PublicKey(user_output_token),
            vaultA: pool_state.vaultA,
            vaultB: pool_state.vaultB,
            authority: authPda,
            poolAccount: pool_pda
        } as any).rpc();
        console.log("Transaction Signature is : ", tx);
    } catch (error) {
        console.error("Instruction Failed", error);
        throw error;
    }
}   