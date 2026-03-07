import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Amm } from "../target/types/amm";
import { Keypair, PublicKey } from "@solana/web3.js";
import { createAccount, createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { assert } from "chai";

describe("amm", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(anchor.AnchorProvider.env());
  const wallet = provider.wallet as anchor.Wallet;
  const program = anchor.workspace.amm as Program<Amm>;

  let tokenAMint: PublicKey;
  let tokenBMint: PublicKey;
  let authorityPda: PublicKey;
  let vault_a: PublicKey;
  let vault_b: PublicKey;
  let pool_pda: PublicKey;

  let pool_fee = 30;


  before(async () => {
    const payerKeypair = (wallet as any).payer as Keypair;
    tokenAMint = await createMint(provider.connection,
      payerKeypair,
      wallet.publicKey,
      null,
      6
    );
    tokenBMint = await createMint(provider.connection, payerKeypair, wallet.publicKey, null, 6);

    let [pool_address, bump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool"),
        tokenAMint.toBuffer(),
        tokenBMint.toBuffer()
      ],
      program.programId
    )
    pool_pda = pool_address
  })

  it("Initializes the AMM pool with correct state, fee, and PDA authority", async () => {
    console.log("\n--- Test: Initialize Pool ---");
    const tx = await program.methods.initialize(pool_fee).accounts({
      payer: wallet.publicKey,
      tokenA: tokenAMint,
      tokenB: tokenBMint,
    }).rpc();
    console.log("Your transaction signature", tx);

    let pool_state = await program.account.pool.fetch(pool_pda);
    authorityPda = pool_state.authority;
    assert.equal(pool_state.fee, pool_fee, "Fee does not match");
    assert.ok(pool_state.tokenA.equals(tokenAMint), "Token A does not match");
    assert.ok(pool_state.tokenB.equals(tokenBMint), "Token B does not match");
    assert.equal(pool_state.reserveA.toNumber(), 0, "Reserve A should start at 0");
    assert.equal(pool_state.reserveB.toNumber(), 0, "Reserve B should start at 0");

    console.log("Pool successfully initialized and verified!");
  });


  it("Provide Liquidity In the pool", async () => {
    console.log("\n--- Test: Provide Initial Liquidity ---");
    let token_a_amount = new anchor.BN(50_000_000);
    let token_b_amount = new anchor.BN(10_000_000);

    const pool_state = await program.account.pool.fetch(pool_pda);
    //create the user token acccount with the mint;
    const userTokenAAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection, (wallet as any).payer, tokenAMint, wallet.publicKey
    );
    const userTokenBAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection, (wallet as any).payer, tokenBMint, wallet.publicKey
    );
    const userLpAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection, (wallet as any).payer, pool_state.lpMint, wallet.publicKey
    );
    //Minting the money to the user token account
    await mintTo(provider.connection, (wallet as any).payer, tokenAMint, userTokenAAccount.address, wallet.publicKey, 100_000_000);
    await mintTo(provider.connection, (wallet as any).payer, tokenBMint, userTokenBAccount.address, wallet.publicKey, 100_000_000);

    const [authPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("authority"), pool_pda.toBuffer()],
      program.programId
    );

    let tx = await program.methods
      .provideLiquidity(token_a_amount, token_b_amount)
      .accounts({
        payer: wallet.publicKey,
        poolAccount: pool_pda,
        authority: authPda,
        vaultA: pool_state.vaultA,
        vaultB: pool_state.vaultB,
        lpMint: pool_state.lpMint,
        userTokenA: userTokenAAccount.address,
        userTokenB: userTokenBAccount.address,
        userLpAccount: userLpAccount.address,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      } as any)
      .rpc();

    const updatedPool = await program.account.pool.fetch(pool_pda);
    assert.equal(updatedPool.reserveA.toNumber(), token_a_amount.toNumber());
    console.log("Liquidity provided successfully!")
    console.log("Updated Reserves: A:", updatedPool.reserveA.toNumber() / 1e6, "B:", updatedPool.reserveB.toNumber() / 1e6);
    console.log("User LP Balance:", userLpAccount.amount);
    console.log("Your transaction signature", tx);
  });

  it("Swaps Token B for Token A", async () => {
    console.log("\n--- Test: Swap B for A ---");
    const amountIn = new anchor.BN(2_000_000);
    const minAmountOut = new anchor.BN(0); // We set 0 for testing; in prod use slippage

    const pool_state = await program.account.pool.fetch(pool_pda);

    // 2. Get User Token Accounts
    const userTokenAAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection, (wallet as any).payer, tokenAMint, wallet.publicKey
    );
    const userTokenBAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection, (wallet as any).payer, tokenBMint, wallet.publicKey
    );
    console.log(`Swapping ${amountIn.toNumber() / 1e6} Token B...`);
    // 3. Execute Swap
    // Note: 'userInputToken' will be B, 'userOutputToken' will be A
    const tx = await program.methods
      .swapToken(amountIn, minAmountOut)
      .accounts({
        payer: wallet.publicKey,
        poolAccount: pool_pda,
        authority: authorityPda,
        vaultA: pool_state.vaultA,
        vaultB: pool_state.vaultB,
        userInputToken: userTokenBAccount.address, // Swapping B...
        userOutputToken: userTokenAAccount.address, // ...for A
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      } as any)
      .rpc();

    console.log("Swap transaction signature:", tx);

    // 4. Verify the reserves changed
    const finalPoolState = await program.account.pool.fetch(pool_pda);

    console.log("New Reserve A:", finalPoolState.reserveA.toNumber() / 1e6);
    console.log("New Reserve B:", finalPoolState.reserveB.toNumber() / 1e6);

    // Reserve B should be 12, Reserve A should be ~41.66
    assert.equal(finalPoolState.reserveB.toNumber(), 12_000_000);
    assert.ok(finalPoolState.reserveA.toNumber() < 50_000_000);
  });

  it("Adds second round of liquidity and checks proportions", async () => {
    console.log("\n--- Test: Proportional Liquidity (2nd Deposit) ---");
    // 1. Current reserves are ~41.87A and 12B.
    // We will try to add 10A and 10B. 
    const depositA = new anchor.BN(10_000_000);
    const depositB = new anchor.BN(10_000_000);

    const pool_state = await program.account.pool.fetch(pool_pda);

    const lpSupplyBefore = (await provider.connection.getTokenSupply(pool_state.lpMint)).value.amount;

    const userTokenAAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection, (wallet as any).payer, tokenAMint, wallet.publicKey
    );
    const userTokenBAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection, (wallet as any).payer, tokenBMint, wallet.publicKey
    );
    const userLpAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection, (wallet as any).payer, pool_state.lpMint, wallet.publicKey
    );

    // 2. Execute Provide Liquidity again
    await program.methods
      .provideLiquidity(depositA, depositB)
      .accounts({
        payer: wallet.publicKey,
        poolAccount: pool_pda,
        authority: authorityPda,
        vaultA: pool_state.vaultA,
        vaultB: pool_state.vaultB,
        lpMint: pool_state.lpMint,
        userTokenA: userTokenAAccount.address,
        userTokenB: userTokenBAccount.address,
        userLpAccount: userLpAccount.address,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      } as any)
      .rpc();

    // 3. Verify Proportions
    const poolAfter = await program.account.pool.fetch(pool_pda);
    const lpSupplyAfter = (await provider.connection.getTokenSupply(pool_state.lpMint)).value.amount;

    const actualAddedA = poolAfter.reserveA.sub(pool_state.reserveA).toNumber();
    const actualAddedB = poolAfter.reserveB.sub(pool_state.reserveB).toNumber();

    console.log(`Requested: 10A, 10B`);
    console.log(`Accepted: ${actualAddedA / 1e6}A, ${actualAddedB / 1e6}B`);

    // The ratio of added tokens (A/B) should equal the ratio of the pool before (A/B)
    const poolRatio = pool_state.reserveA.toNumber() / pool_state.reserveB.toNumber();
    const addedRatio = actualAddedA / actualAddedB;

    console.log(`Pool Ratio: ${poolRatio.toFixed(4)}`);
    console.log(`Added Ratio: ${addedRatio.toFixed(4)}`);
    console.log(`ACTUALLY Accepted: ${actualAddedA / 1e6}A and ${actualAddedB / 1e6}B`);
    console.log(`Final Reserves: A: ${poolAfter.reserveA.toNumber() / 1e6}, B: ${poolAfter.reserveB.toNumber() / 1e6}`);

    // Verification: The ratios should be nearly identical (allowing for tiny rounding dust)
    assert.approximately(addedRatio, poolRatio, 0.001, "Liquidity was not added in correct proportion!");

    // LP tokens should also be minted in proportion to the increase in reserves
    assert.ok(new anchor.BN(lpSupplyAfter).gt(new anchor.BN(lpSupplyBefore)), "No LP tokens were minted!");
  });


  it("Removes Liquidity from the pool", async () => {
    console.log("\n--- Test: Remove Liquidity ---");
    const pool_state = await program.account.pool.fetch(pool_pda);

    // 1. Check how many LP tokens the user has
    const userLpAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection, (wallet as any).payer, pool_state.lpMint, wallet.publicKey
    );

    const userTokenAAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection, (wallet as any).payer, tokenAMint, wallet.publicKey
    );
    const userTokenBAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection, (wallet as any).payer, tokenBMint, wallet.publicKey
    );
    const lpBalance = new anchor.BN(userLpAccount.amount.toString());

    console.log("Removing LP Amount:", lpBalance.toNumber() / 1e6);

    // 2. Execute Remove Liquidity
    await program.methods
      .removeLiquidity(lpBalance)
      .accounts({
        payer: wallet.publicKey,
        poolAccount: pool_pda,
        authority: authorityPda,
        vaultA: pool_state.vaultA,
        vaultB: pool_state.vaultB,
        lpMint: pool_state.lpMint,
        userTokenA: userTokenAAccount.address,
        userTokenB: userTokenBAccount.address,
        userLpAccount: userLpAccount.address,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      } as any)
      .rpc();

    // 3. Verify pool is now (almost) empty
    const finalPoolState = await program.account.pool.fetch(pool_pda);
    console.log("Final Reserve A:", finalPoolState.reserveA.toNumber());
    console.log("Final Reserve B:", finalPoolState.reserveB.toNumber());

    assert.equal(finalPoolState.reserveA.toNumber(), 0);
    assert.equal(finalPoolState.reserveB.toNumber(), 0);
  });
});
