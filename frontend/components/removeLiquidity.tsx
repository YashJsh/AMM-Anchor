"use client"

import { useState } from "react"
import { PoolWithNeededMetaData } from "@/helper/getAllPool"
import { UserTokens } from "@/helper/getUserToken"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, AlertCircle, Droplets } from "lucide-react"
import { removeLiquidity } from "@/program/removeLiquidity"
import { useWallet } from "@solana/wallet-adapter-react"
import { Program } from "@coral-xyz/anchor"
import { Amm } from "../../target/types/amm"
import { toast } from "sonner"
import { BN } from "bn.js"

export const RemoveLiquidity = ({
    pools,
    userTokens,
    program

}: {
    pools: PoolWithNeededMetaData[],
    userTokens: UserTokens[],
    program: Program<Amm>
}) => {
    const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
    const [removePercentage, setRemovePercentage] = useState<number>(50);
    const [lpAmount, setLpAmount] = useState("");

    // 1. Filter pools where the user owns the LP token
    // Note: This assumes your pool object includes the 'lpMint' address
    const activePools = pools.filter(pool =>
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
        if (!selectedPoolId) return;

        const pool = pools.find(
            p => p.publicKey.toString() === selectedPoolId
        );

        if (!pool) return;

        const userLpToken = userTokens.find(
            t => t.mint === pool.lpMint.toBase58()
        );

        if (!userLpToken) return;

        const lpAmountBN = new BN(
            Math.floor(Number(lpAmount) * 10 ** userLpToken.decimals)
        )

        const tokenAAccount = userTokens.find(
            t => t.mint === pool.tokenA.toBase58()
        );

        const tokenBAccount = userTokens.find(
            t => t.mint === pool.tokenB.toBase58()
        );

        if (!tokenAAccount || !tokenBAccount) return;

        try {
            const tx = await removeLiquidity(
                program,
                lpAmountBN,
                pool.tokenA.toBase58(),
                pool.tokenB.toBase58(),
                tokenAAccount.pubkey,
                tokenBAccount.pubkey,
                userLpToken.pubkey,
                wallet
            );
            toast.success("Removed Liquidity Successfully");
        } catch (error) {
            toast.error("Removing Liquidity Failed");
            console.error("Error in removing liquidity : ", error);
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
                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${isSelected ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:bg-muted/40"
                                }`}
                            onClick={() => setSelectedPoolId(pool.publicKey.toString())}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        <img src={pool.tokenAlogo} className="w-6 h-6 rounded-full border border-background" />
                                        <img src={pool.tokenBlogo} className="w-6 h-6 rounded-full border border-background" />
                                    </div>
                                    <span className="font-bold text-sm">{pool.tokenAsymbol}/{pool.tokenBsymbol}</span>
                                </div>
                                <h1>LP: {userLpToken?.amount}</h1>
                            </div>

                            {isSelected && (
                                <div className="mt-4 pt-4 border-t border-border space-y-4 animate-in fade-in zoom-in-95">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground">Amount to Remove</span>
                                        <span className="text-lg font-bold text-primary">{removePercentage}%</span>
                                    </div>

                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        value={removePercentage}
                                        onChange={(e) => setRemovePercentage(Number(e.target.value))}
                                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                    />

                                    <div className="grid grid-cols-4 gap-2">
                                        {[25, 50, 75, 100].map(p => (
                                            <Button
                                                key={p}
                                                variant="outline"
                                                size="sm"
                                                className="text-[10px]"
                                                onClick={() => setRemovePercentage(p)}
                                            >
                                                {p}%
                                            </Button>
                                        ))}
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
        </Card>
    );
};