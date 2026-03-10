# 🌊 Solana AMM — Decentralized Exchange


A fully on-chain **Automated Market Maker** built on Solana using the Anchor framework — inspired by Uniswap v2 / Raydium.



---

## ✨ Features

| Feature | Description |
|---|---|
| 🔁 **Token Swapping** | Swap between token pairs with constant product formula |
| 💧 **Add Liquidity** | Deposit token pairs and receive LP tokens |
| 🔥 **Remove Liquidity** | Burn LP tokens and withdraw proportional reserves |
| 💰 **Trading Fees** | 0.3% fee distributed to liquidity providers |
| 🛡️ **Slippage Protection** | Frontend enforces minimum output threshold |
| 🔐 **PDA Authority** | Vaults are controlled by a derived program authority |

---

## 🧮 AMM Math

### Constant Product Formula
```
x * y = k
```

### Swap Output (with 0.3% fee)
```
amountOut = (amountIn × 997 × reserveOut) / (reserveIn × 1000 + amountIn × 997)
```

### LP Minting — First Deposit
```
LP = sqrt(amountA × amountB)
```

### LP Minting — Subsequent Deposits
```
lpA = amountA × totalSupply / reserveA
lpB = amountB × totalSupply / reserveB
LP minted = min(lpA, lpB)
```

### Remove Liquidity
```
shareA = lpAmount × reserveA / totalSupply
shareB = lpAmount × reserveB / totalSupply
```

---

## 🏗️ Architecture

```
User (Phantom Wallet)
        │
        ▼
Frontend (Next.js + React)
        │
        ▼
Anchor Client (@coral-xyz/anchor)
        │
        ▼
Solana Program (Rust / Anchor)
        │
   ┌────┴────┐
   ▼         ▼
Vault A    Vault B
(Token A)  (Token B)
```

### Pool Account State
```
Pool {
  tokenA       — Mint address of Token A
  tokenB       — Mint address of Token B
  vaultA       — Token account holding reserve A
  vaultB       — Token account holding reserve B
  reserveA     — Current reserve of Token A
  reserveB     — Current reserve of Token B
  lpMint       — LP token mint
  authority    — PDA with signing authority over vaults
  fee          — Trading fee (3 = 0.3%)
}
```

---

## 🛠️ Tech Stack

**Smart Contract**
- [Solana](https://solana.com/) — L1 blockchain
- [Anchor](https://www.anchor-lang.com/) — Rust framework for Solana programs
- [SPL Token Program](https://spl.solana.com/token) — Token standard

**Frontend**
- [Next.js 15](https://nextjs.org/) — React framework
- [TypeScript](https://www.typescriptlang.org/) — Type safety
- [TailwindCSS](https://tailwindcss.com/) — Styling
- [ShadCN UI](https://ui.shadcn.com/) — Component library
- [Phantom Wallet Adapter](https://phantom.app/) — Wallet integration
- [@solana/web3.js](https://solana-labs.github.io/solana-web3.js/) — Blockchain interaction
- [@coral-xyz/anchor](https://www.npmjs.com/package/@coral-xyz/anchor) — Anchor client SDK

---

## 🚀 Getting Started

### Prerequisites
- [Rust](https://www.rust-lang.org/tools/install)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation)
- [Node.js](https://nodejs.org/) v18+
- [Phantom Wallet](https://phantom.app/)

### 1. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 2. Start Local Validator
```bash
solana-test-validator
```

### 3. Build the Program
```bash
anchor build
```

### 4. Run Tests
```bash
anchor test
```

### 5. Deploy Program
```bash
anchor deploy
```

### 6. Run Frontend
```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and connect your Phantom wallet.

---

## 🔄 Example Flow

### 1. Initialize Pool
Deploy a new pool with two token mints. A PDA authority is derived to control the vaults.

### 2. Add Liquidity
```
Deposit: 42 Token A + 12 Token B
Receive: LP tokens proportional to your share
```

### 3. Swap Tokens
```
Input:  1 Token A
Output: ~0.028 Token B  (after 0.3% fee, based on pool ratio)
```
Frontend calculates the estimated output and enforces a minimum received threshold with slippage protection.

### 4. Remove Liquidity
```
Burn: LP tokens
Receive: proportional share of Token A + Token B reserves
```

---

## 🔐 Safety Features

- ✅ **Overflow-safe math** — all arithmetic uses `checked_mul` / `checked_div` with `u128` intermediates
- ✅ **Slippage protection** — `min_out` enforced on-chain at line 258 of `lib.rs`
- ✅ **PDA authority validation** — vaults can only be signed by the derived program authority
- ✅ **Token mint validation** — input/output mints verified against pool state
- ✅ **Duplicate token check** — cannot swap a token for itself
- ✅ **Reserve balance check** — output cannot exceed available reserves
- ✅ **Fresh reserve reads** — frontend fetches live pool state before each swap to prevent stale `minOut`

---

## 📡 On-Chain Swap Instruction

```
Instruction: SwapToken
Args:
  amount   — input amount in lamports
  min_out  — minimum acceptable output (slippage guard)

Accounts:
  pool_account       — Pool state PDA
  vault_a            — Reserve vault for Token A
  vault_b            — Reserve vault for Token B
  user_input_token   — User's source token account
  user_output_token  — User's destination token account
  authority          — Pool PDA signer
  payer              — Transaction fee payer

Inner CPIs:
  Transfer: User → Vault   (deposit input)
  Transfer: Vault → User   (withdraw output)
```

---


## 🎓 What I Learned

Building this project gave me hands-on experience with:

- Solana program architecture and account model
- Anchor framework — PDAs, CPIs, account constraints
- Constant product AMM mechanics
- SPL token interactions (vaults, mints, LP tokens)
- PDA signing for vault authority
- Frontend ↔ smart contract integration with `@coral-xyz/anchor`
- Handling `u64` overflow with `u128` intermediate math
- Stale state bugs in React and how to fix them with live RPC fetches

---

## 🌐 Network

> Deployed on **Solana Devnet**. Connect Phantom wallet to interact.

---

## 👨‍💻 Author

**Yash Joshi**  
Full Stack Developer | Solana | Web3

