"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ArrowDown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { TokenSelector } from "./tokenSelector";
import { UserTokens } from "@/helper/getUserToken";
import { swap_token } from "@/program/swap";
import { Program } from "@coral-xyz/anchor";
import { Amm } from "../../target/types/amm";
import { getSwapOutput } from "@/helper/getSwapAmount";
import { PoolWithNeededMetaData } from "@/helper/getAllPool";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";

export const CreateSwap = ({
  userTokens,
  program,
  poolData,
  onTransactionComplete,
}: {
  userTokens: UserTokens[];
  program: Program<Amm>;
  poolData: PoolWithNeededMetaData[];
  onTransactionComplete?: () => Promise<void>;
}) => {
  const wallet = useWallet();
  const [fromTokenMint, setFromTokenMint] = useState<string>("");
  const [toTokenMint, setToTokenMint] = useState<string>("");
  const [fromAmount, setFromAmount] = useState<string>("");
  const [outputAmount, setOutputAmount] = useState<string>("");
  const [selectedPool, setSelectedPool] = useState<PoolWithNeededMetaData | null>(null);
  const [minOutLamports, setMinOutLamports] = useState<bigint>(BigInt(0));
  const [fromTokenAccount, setFromTokenAccount] = useState<string>("");
  const [toTokenAccount, setToTokenAccount] = useState<string>("");
  const [fromTokenAccountDecimal, setFromTokenAccountDecimal] = useState(0);

  const swapToken = async () => {

    if (!selectedPool) {
      toast.error("No pool found for this pair");
      return;
    }

    if (!fromAmount || Number(fromAmount) <= 0) {
      toast.error("Enter valid amount");
      return;
    }

    if (fromTokenMint === toTokenMint) {
      toast.error("Can't swap same tokens");
      return;
    }

    if (!fromTokenAccount || !toTokenAccount) {
      toast.error("Token accounts not found");
      return;
    }

    const amountInLamports = BigInt(
      Math.floor(Number(fromAmount) * Math.pow(10, fromTokenAccountDecimal))
    );

    try {

      toast.loading("Executing swap...");

      await swap_token(
        program,
        amountInLamports,
        minOutLamports,
        fromTokenMint,
        toTokenMint,
        fromTokenAccount,
        toTokenAccount,
        wallet
      );

      toast.dismiss();
      toast.success("Swap successful");
      
      if (onTransactionComplete) {
        await onTransactionComplete();
      }

    } catch (error) {

      toast.dismiss();
      toast.error("Swap failed");

      console.error("Swap error:", error);
    }
  };

  useEffect(() => {
    if (!fromTokenMint || !toTokenMint || !poolData) return;

    const pool = poolData.find(
      (p) =>
        (p.tokenA.toBase58() === fromTokenMint &&
          p.tokenB.toBase58() === toTokenMint) ||
        (p.tokenA.toBase58() === toTokenMint &&
          p.tokenB.toBase58() === fromTokenMint)
    );
    setSelectedPool(pool || null);
    setOutputAmount("");
  }, [fromTokenMint, toTokenMint, poolData]);

  useEffect(() => {
    const fromAcc = userTokens.find((t) => t.mint === fromTokenMint);
    const toAcc = userTokens.find((t) => t.mint === toTokenMint);
    setFromTokenAccount(fromAcc?.pubkey.toBase58() || "");
    setToTokenAccount(toAcc?.pubkey.toBase58() || "");
    setFromTokenAccountDecimal(fromAcc?.decimals!);
  }, [fromTokenMint, toTokenMint, userTokens]);

  useEffect(() => {
    if (!fromAmount || !selectedPool || !fromTokenMint || !toTokenMint) return;

    const inputToken = userTokens.find((t) => t.mint === fromTokenMint);
    const outputToken = userTokens.find((t) => t.mint === toTokenMint);

    if (!inputToken || !outputToken) return;

    const isAToB = selectedPool.tokenA.toBase58() === fromTokenMint;

    const reserveIn = BigInt(
      isAToB ? selectedPool.reserveA.toString() : selectedPool.reserveB.toString()
    );

    const reserveOut = BigInt(
      isAToB ? selectedPool.reserveB.toString() : selectedPool.reserveA.toString()
    );

    const amountInLamports = BigInt(
      Math.floor(Number(fromAmount) * Math.pow(10, fromTokenAccountDecimal))
    );

    if (amountInLamports === BigInt(0)) {
      setOutputAmount("0");
      return;
    }

    const outputLamports = getSwapOutput(amountInLamports, reserveIn, reserveOut);

    if (outputLamports === BigInt(0)) {
      setOutputAmount("0");
      return;
    }

    // minOut directly from outputLamports — formula matches contract exactly
    const minOut = (outputLamports * BigInt(95)) / BigInt(100);
    setMinOutLamports(minOut - BigInt(2));

    const outputHuman = Number(outputLamports) / Math.pow(10, outputToken.decimals);
    setOutputAmount(outputHuman.toFixed(6));

  }, [fromAmount, selectedPool, fromTokenMint, toTokenMint, userTokens]);

  const handleFlip = () => {
    const tempMint = fromTokenMint;
    setFromTokenMint(toTokenMint);
    setToTokenMint(tempMint);
    setOutputAmount("");
  };

  return (
    <Card className="w-full max-w-[440px] bg-card shadow-2xl backdrop-blur-xl border-border">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">Swap</CardTitle>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-accent text-accent-foreground">
            0.3% Fee
          </span>
        </div>
        <CardDescription>Instant token exchange</CardDescription>
      </CardHeader>

      <CardContent className="space-y-1 mt-4">
        {/* FROM TOKEN */}
        <div className="p-4 rounded-2xl border border-border space-y-2 bg-muted/40">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>From</span>
            <span>
              Balance:{" "}
              {userTokens.find((t) => t.mint === fromTokenMint)?.amount}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.00"
              className="bg-transparent text-2xl font-semibold outline-none w-full"
              disabled={!fromTokenMint || !toTokenMint}
            />
            <TokenSelector
              tokens={userTokens}
              value={fromTokenMint}
              onValueChange={setFromTokenMint}
            />
          </div>
        </div>

        {/* FLIP ARROW */}
        <div className="flex justify-center -my-3 relative z-10">
          <div
            onClick={handleFlip}
            className="bg-card p-2 rounded-xl border border-border cursor-pointer hover:bg-accent transition-colors active:scale-95"
          >
            <ArrowDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* TO TOKEN */}
        <div className="p-4 rounded-2xl border border-border space-y-2 bg-muted/40">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>To (Estimate)</span>
            <span>
              Balance: {userTokens.find((t) => t.mint == toTokenMint)?.amount}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <input
              disabled
              type="number"
              placeholder="0.00"
              className="bg-transparent text-2xl font-semibold outline-none w-full text-muted-foreground cursor-not-allowed"
              value={outputAmount}
            />
            <TokenSelector
              tokens={userTokens}
              value={toTokenMint}
              onValueChange={setToTokenMint}
            />
          </div>
        </div>
        {fromAmount && fromTokenMint && toTokenMint && (
          <div className="mt-4 p-3 rounded-xl bg-muted/20 border border-border/50 space-y-2 animate-in fade-in slide-in-from-top-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Expected Output</span>
              <span className="font-medium">{outputAmount}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                Slippage Tolerance <Info className="w-3 h-3" />
              </span>
              <span className="text-primary font-medium">1%</span>
            </div>
            <div className="pt-2 border-t border-border/50 flex justify-between text-[10px] uppercase tracking-wider font-bold">
              <span className="text-muted-foreground">Minimum Received</span>
              <span>{(Number(outputAmount) * 0.99).toFixed(4)}</span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 mt-4">
        <Button
          className="w-full uppercase font-bold py-6"
          onClick={swapToken}
          disabled={
            !fromTokenMint || !toTokenMint || !fromAmount || !selectedPool || outputAmount === "0"
          }
        >
          {fromTokenMint && toTokenMint ? "Swap" : "Select Tokens"}
        </Button>
      </CardFooter>
    </Card>
  );
};
