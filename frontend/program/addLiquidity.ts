import { Program } from "@coral-xyz/anchor";
import { Amm } from "../../target/types/amm";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import BN from "bn.js";
import { PROGRAM_ID } from "@/utils/program_id";
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, getMint, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { UserTokens } from "@/helper/getUserToken";
import { WalletContextState } from "@solana/wallet-adapter-react";

export const AddLiquidity = async (program: Program<Amm>, token_a: string, token_b: string, amount_a: number, amount_b: number, userToken: UserTokens[], wallet: WalletContextState, connection: Connection
) => {

    const [pool_pda] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("pool"),
            new PublicKey(token_a).toBuffer(),
            new PublicKey(token_b).toBuffer()
        ],
        PROGRAM_ID
    );
    const mintA = await getMint(connection, new PublicKey(token_a));
    const mintB = await getMint(connection, new PublicKey(token_b));

    const userTokenAAccount = userToken.find(
        (t) => t.mint === token_a
    );

    const userTokenBAccount = userToken.find(
        (t) => t.mint === token_b
    );

    if (!userTokenAAccount || !userTokenBAccount) {
        console.log("User does not own required tokens");
        throw new Error("User does not own required tokens");
    }

    const pool_state = await program.account.pool.fetch(pool_pda);

    const userLpAccount = userToken.find((p) => p.mint == pool_state.lpMint.toString());
    let userLpPDA = userLpAccount?.pubkey;

    if (!userLpAccount) {
        const lpMint = new PublicKey(pool_state.lpMint);

        const userLpAddress = await getAssociatedTokenAddress(
            lpMint,
            wallet.publicKey!
        );

        const accountInfo = await connection.getAccountInfo(userLpAddress);

        if (!accountInfo) {

            const transaction = new Transaction().add(
                createAssociatedTokenAccountInstruction(
                    wallet.publicKey!,
                    userLpAddress,
                    wallet.publicKey!,
                    lpMint
                )
            );

            const { blockhash, lastValidBlockHeight } =
                await connection.getLatestBlockhash();

            transaction.recentBlockhash = blockhash;
            transaction.feePayer = wallet.publicKey!;

            const signature = await wallet.sendTransaction(transaction, connection);

            await connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight
            });
            userLpPDA = userLpAddress; 
            console.log("LP ATA created:", userLpAddress.toBase58());
        }
        const token_amount_a = new BN(
            amount_a * 10 ** mintA.decimals
        );
        const token_amount_b = new BN(
            amount_b * 10 ** mintB.decimals
        );
        const [authPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("authority"), pool_pda.toBuffer()],
            program.programId
        );
        try {
            const tx = await program.methods.provideLiquidity(token_amount_a, token_amount_b).accounts({
                userTokenA: userTokenAAccount?.pubkey,
                userTokenB: userTokenBAccount?.pubkey,
                lpMint: pool_state.lpMint,
                userLpAccount: userLpAddress,
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
}