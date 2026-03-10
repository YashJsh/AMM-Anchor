"use client"

import { useState } from "react"
import { PoolWithNeededMetaData } from "@/helper/getAllPool"
import { UserTokens } from "@/helper/getUserToken"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, AlertCircle} from "lucide-react"
import { removeLiquidity } from "@/program/removeLiquidity"
import { useWallet } from "@solana/wallet-adapter-react"
import { Program } from "@coral-xyz/anchor"
import { Amm } from "../idl/amm";
import { toast } from "sonner"
import { BN } from "bn.js"
import { getExplorerLink } from "@/helper/explorerHelper"

export const RemoveLiquidity = ({
    pools,
    userTokens,
    program,
    onTransactionComplete

}: {
    pools: PoolWithNeededMetaData[],
    userTokens: UserTokens[],
    program: Program<Amm>,
    onTransactionComplete?: () => Promise<void>
}) => {
    const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
    const [lpAmount, setLpAmount] = useState("");

    const activePools = (pools ?? []).filter(pool =>
        userTokens.find(t => t.mint === pool.lpMint.toBase58() && Number(t.amount) > 0)
    );

    if (activePools.length == 0) {
        return (
            <Card className="w-full max-w-[440px] border-dashed bg-muted/10">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="bg-muted p-4 rounded-full mb-4">
                        <AlertCircle className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-lg font-semibold">No Liquidity Found</CardTitle>
                    <CardDescription className="max-w-[250px] mt-2">
                        You don't have any active LP tokens. Provide liquidity to a pool to see it here.
                    </CardDescription>
                </CardContent>
            </Card>
        );
    }

    const wallet = useWallet();

  const removeLiquidityFunc = async () => {
    if (!selectedPoolId) {
        toast.error("Please select a pool first");
        return;
    }

    const pool = pools.find(
        p => p.publicKey.toString() === selectedPoolId
    );

    if (!pool) {
        toast.error("Pool not found");
        return;
    }

    const userLpToken = userTokens.find(
        t => t.mint === pool.lpMint.toBase58()
    );

    if (!userLpToken) {
        toast.error("LP token account not found");
        return;
    }

    if (!lpAmount || Number(lpAmount) <= 0) {
        toast.error("Enter LP amount to remove");
        return;
    }

    if (Number(lpAmount) > Number(userLpToken.amount)) {
        toast.error("Not enough LP tokens");
        return;
    }

    const loadingToast = toast.loading("Preparing transaction...");

    const lpAmountBN = new BN(
        Math.floor(Number(lpAmount) * 10 ** userLpToken.decimals)
    );

    const tokenAAccount = userTokens.find(
        t => t.mint === pool.tokenA.toBase58()
    );

    const tokenBAccount = userTokens.find(
        t => t.mint === pool.tokenB.toBase58()
    );

    if (!tokenAAccount || !tokenBAccount) {
        toast.error("Token accounts not found", { id: loadingToast });
        return;
    }

    try {
        toast.loading("Waiting for wallet approval...", { id: loadingToast });

        const signature = await removeLiquidity(
            program,
            lpAmountBN,
            pool.tokenA.toBase58(),
            pool.tokenB.toBase58(),
            tokenAAccount.pubkey,
            tokenBAccount.pubkey,
            userLpToken.pubkey,
            wallet
        );

        const explorerUrl = getExplorerLink(signature, "devnet");

        toast.success("Liquidity removed successfully!", { 
            id: loadingToast,
            action: {
                label: "View Tx",
                onClick: () => window.open(explorerUrl, '_blank')
            }
        });

        console.log("Remove liquidity tx:", signature);

        setLpAmount("");
        
        if (onTransactionComplete) {
            await onTransactionComplete();
        }

    } catch (error: any) {

        if (error?.message?.includes("User rejected")) {
            toast.error("Transaction rejected", { id: loadingToast });
        } else {
            toast.error("Liquidity removal failed", { id: loadingToast });
        }

        console.error(error);
    }
};

    return (
        <Card className="w-full max-w-[440px] shadow-2xl backdrop-blur-xl">
            <CardHeader>
                <CardTitle className="text-xl font-bold">Your Liquidity</CardTitle>
                <CardDescription>Withdraw your tokens and accrued fees</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {activePools.map((pool) => {
                    const userLpToken = userTokens.find(t => t.mint === pool.lpMint.toBase58());
                    const isSelected = selectedPoolId === pool.publicKey.toString();

                    return (
                        <div
                            key={pool.publicKey.toString()}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border bg-muted/20 hover:bg-muted/40"
                                }`}
                            onClick={() => setSelectedPoolId(pool.publicKey.toString())}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        <img src={pool.tokenAlogo} alt="" className="w-6 h-6 rounded-full border border-background" />
                                        <img src={pool.tokenBlogo} alt=""   className="w-6 h-6 rounded-full border border-background" />
                                    </div>
                                    <span className="font-bold text-sm">
                                        {pool.tokenAsymbol}/{pool.tokenBsymbol}
                                    </span>
                                </div>

                                <h1>LP: {userLpToken?.amount}</h1>
                            </div>

                            {isSelected && (
                                <div className="mt-4 pt-4 border-t border-border space-y-4 animate-in fade-in zoom-in-95">

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>LP Amount</span>
                                            <span>Balance: {userLpToken?.amount}</span>
                                        </div>

                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={lpAmount}
                                            onChange={(e) => setLpAmount(e.target.value)}
                                            className="w-full p-3 rounded-lg bg-background border border-border text-lg font-semibold outline-none"
                                        />
                                    </div>

                                    <Button
                                        className="w-full gap-2"
                                        variant="destructive"
                                        onClick={removeLiquidityFunc}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Remove Liquidity
                                    </Button>

                                </div>
                            )}
                        </div>
                    );
                })}
            </CardContent>
        </Card >
    );
};