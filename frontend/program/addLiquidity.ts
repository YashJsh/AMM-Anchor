import { Program } from "@coral-xyz/anchor";
import { Amm } from "../../target/types/amm";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import BN from "bn.js";
import { PROGRAM_ID } from "@/utils/program_id";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { UserTokens } from "@/helper/getUserToken";
import { WalletContextState } from "@solana/wallet-adapter-react";

export const AddLiquidity = async (
  program: Program<Amm>,
  token_a: PublicKey,
  token_b: PublicKey,
  amount_a: number,
  amount_b: number,
  userToken: UserTokens[],
  wallet: WalletContextState,
  connection: Connection
) => {
  if (!wallet.publicKey) throw new Error("Wallet not connected");

  const [token0, token1] =
    token_a.toBuffer().compare(token_b.toBuffer()) < 0
      ? [token_a, token_b]
      : [token_b, token_a];

  const [pool_pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), token0.toBuffer(), token1.toBuffer()],
    PROGRAM_ID
  );

  const mintA = await getMint(connection, token_a);
  const mintB = await getMint(connection, token_b);

  const userTokenAAccount = userToken.find(
    (t) => t.mint === token_a.toBase58()
  );

  const userTokenBAccount = userToken.find(
    (t) => t.mint === token_b.toBase58()
  );

  if (!userTokenAAccount || !userTokenBAccount) {
    throw new Error("User does not own required tokens");
  }

  const pool_state = await program.account.pool.fetch(pool_pda);

  const lpMint = new PublicKey(pool_state.lpMint);

  let userLpPDA = await getAssociatedTokenAddress(lpMint, wallet.publicKey);

  const accountInfo = await connection.getAccountInfo(userLpPDA);

  // Create LP ATA if it doesn't exist
  if (!accountInfo) {
    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        userLpPDA,
        wallet.publicKey,
        lpMint
      )
    );

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    const signature = await wallet.sendTransaction(transaction, connection);

    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    });

    console.log("LP ATA created:", userLpPDA.toBase58());
  }

  const token_amount_a = new BN(
    Math.floor(amount_a * 10 ** mintA.decimals)
  );

  const token_amount_b = new BN(
    Math.floor(amount_b * 10 ** mintB.decimals)
  );

  const [authPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("authority"), pool_pda.toBuffer()],
    program.programId
  );

  try {
    const tx = await program.methods
      .provideLiquidity(token_amount_a, token_amount_b)
      .accounts({
        payer: wallet.publicKey,
        userTokenA: userTokenAAccount.pubkey,
        userTokenB: userTokenBAccount.pubkey,
        lpMint: pool_state.lpMint,
        userLpAccount: userLpPDA,
        vaultA: pool_state.vaultA,
        vaultB: pool_state.vaultB,
        authority: authPda,
        poolAccount: pool_pda,
        tokenProgram: TOKEN_PROGRAM_ID,
      } as any)
      .rpc();

    console.log("Liquidity tx:", tx);

    const updatedPool = await program.account.pool.fetch(pool_pda);

    return updatedPool;
  } catch (error) {
    console.error("Provide liquidity failed:", error);
    throw error;
  }
};