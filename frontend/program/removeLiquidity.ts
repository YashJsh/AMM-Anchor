import { PublicKey } from "@solana/web3.js";
import { Amm } from "../../target/types/amm";
import { Program } from "@coral-xyz/anchor/dist/cjs/program";
import BN from "bn.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { WalletContextState } from "@solana/wallet-adapter-react";

export const removeLiquidity = async (
    program: Program<Amm>,
    lp_Amount: BN,
    tokenAMint: string,
    tokenBMint: string,
    userTokenAAccount: PublicKey,
    userTokenBAccount: PublicKey,
    userLpAccount: PublicKey,
    wallet: WalletContextState,
) => {
    if (!wallet.publicKey) {
        throw new Error("Wallet not connected");
    }
    const mintA = new PublicKey(tokenAMint);
    const mintB = new PublicKey(tokenBMint);

    // deterministic ordering
    const [token0, token1] =
        mintA.toBuffer().compare(mintB.toBuffer()) < 0
            ? [mintA, mintB]
            : [mintB, mintA];

    const [pool_pda] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool"),
            token0.toBuffer(),
            token1.toBuffer(),
        ],
        program.programId
    );

    const pool_state = await program.account.pool.fetch(pool_pda);
    const [authPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("authority"), pool_pda.toBuffer()],
        program.programId
    );
    try {
        const tx = await program.methods.removeLiquidity(lp_Amount).accounts({
            lpMint: pool_state.lpMint,
            userLpAccount: userLpAccount,
            vaultA: pool_state.vaultA,
            vaultB: pool_state.vaultB,
            userTokenA: userTokenAAccount,
            userTokenB: userTokenBAccount,
            authority: authPda,
            poolAccount: pool_pda,
            tokenProgram: TOKEN_PROGRAM_ID,
            payer: wallet.publicKey
        } as any).rpc();

        console.log("Transaction signature : ", tx);
        return tx;
    } catch (error) {
        console.log("Transaction Failed", error);
        throw error;
    }
}   