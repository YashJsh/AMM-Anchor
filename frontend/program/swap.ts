import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor/dist/cjs/program";
import { Amm } from "../../target/types/amm";
import BN from "bn.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

export const swap_token = async (
  program: Program<Amm>,
  amount_in: bigint,
  min_out: bigint,
  inputTokenMint: string,
  outputTokenMint: string,
  inputTokenAccount: string,
  outputTokenAccount: string,
  wallet: WalletContextState
) => {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }
  console.log("Amount in is : ", amount_in);
  console.log("Min out is : ", min_out);
  const mintA = new PublicKey(inputTokenMint);
  const mintB = new PublicKey(outputTokenMint);

  // deterministic ordering
  const [token0, token1] =
    mintA.toBuffer().compare(mintB.toBuffer()) < 0
      ? [mintA, mintB]
      : [mintB, mintA];



  try {
    let [pool_pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), token0.toBuffer(), token1.toBuffer()],
      program.programId
    );
    const [authPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("authority"), pool_pda.toBuffer()],
      program.programId
    );
    const pool_state = await program.account.pool.fetch(pool_pda);
    const isAToB =
      pool_state.tokenA.toBase58() === inputTokenMint;


    const tx = await program.methods
      .swapToken(new BN(amount_in.toString()), new BN(min_out))
      .accounts({
        userInputToken: new PublicKey(inputTokenAccount),
        userOutputToken: new PublicKey(outputTokenAccount),
        vaultA: pool_state.vaultA,
        vaultB: pool_state.vaultB,
        authority: authPda,
        poolAccount: pool_pda,
        payer: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID
      } as any)
      .rpc();
    console.log("Transaction Signature is : ", tx);
  } catch (error) {
    console.error("Instruction Failed", error);
    throw error;
  }
};
