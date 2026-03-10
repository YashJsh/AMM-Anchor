"use client"

import { PoolWithNeededMetaData } from "@/helper/getAllPool";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { UserTokens } from "@/helper/getUserToken";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { Amm } from "../idl/amm";
import { Program } from "@coral-xyz/anchor";
import { AddLiquidity } from "@/program/addLiquidity";
import { Connection } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { getMint } from "@solana/spl-token"
import { getExplorerLink } from "@/helper/explorerHelper";


export const SpecificPool = ({
    pool,
    onClose,
    userTokens,
    program,
    connection,
    onTransactionComplete
}: {
    pool: PoolWithNeededMetaData,
    onClose: () => void,
    userTokens: UserTokens[],
    program: Program<Amm>,
    connection: Connection,
    onTransactionComplete?: () => Promise<void>
}) => {
    const wallet = useWallet();
    const [tokenAAmount, settokenAAmount] = useState("");
    const [tokenBAmount, settokenBAmount] = useState("");

    const [tokenADecimals, setTokenADecimals] = useState(9);
    const [tokenBDecimals, setTokenBDecimals] = useState(9);

    const tokenAAddress = pool.tokenA.toBase58();
    const tokenBAddress = pool.tokenB.toBase58();

    const userTokenA = userTokens.find((t) => t.mint === tokenAAddress);
    const userTokenB = userTokens.find((t) => t.mint === tokenBAddress);

    const hasTokenA = !!userTokenA && Number(userTokenA.amount) > 0;
    const hasTokenB = !!userTokenB && Number(userTokenB.amount) > 0;
    const canProvide = hasTokenA && hasTokenB;


    const addLiquidity = async () => {
        if (!program) {
            return;
        }
        try {
            const result = await AddLiquidity(program, pool.tokenA, pool.tokenB, Number(tokenAAmount), Number(tokenBAmount), userTokens, wallet, connection);
            
            const explorerUrl = getExplorerLink(result.signature, "devnet");
            
            toast.success("Liquidity added", {
                action: {
                    label: "View Tx",
                    onClick: () => window.open(explorerUrl, '_blank')
                }
            });
            
            if (onTransactionComplete) {
                await onTransactionComplete();
            }
        } catch (error) {
            toast.error("Transaction failed");
            console.error("Error in adding liquidity", error);
        }
    }


    const formatReserve = (reserve: any, decimals: number) => {
        return (Number(reserve.toString()) / Math.pow(10, decimals))
            .toLocaleString(undefined, { maximumFractionDigits: 4 });
    };

    return (
        <Dialog open={!!pool} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[440px] border-none bg-card shadow-2xl">
                {pool && (
                    <>
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <DialogTitle className="text-xl">
                                    {pool.tokenAsymbol} / {pool.tokenBsymbol}
                                </DialogTitle>
                            </div>
                        </DialogHeader>

                        <div className="p-3 bg-muted/30 rounded-lg space-y-1">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Pool Contract</p>
                            <p className="font-mono text-[10px] break-all">{pool.publicKey.toBase58()}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 p-4 bg-muted/40 rounded-2xl border border-border">
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-tight">Total {pool.tokenAsymbol}</p>
                                <p className="text-sm font-semibold">{formatReserve(pool.reserveA, pool.tokenADecimal)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-tight">Total {pool.tokenBsymbol}</p>
                                <p className="text-sm font-semibold">{formatReserve(pool.reserveB, pool.tokenBDecimal)}</p>
                            </div>
                            <div className="col-span-2 pt-2 border-t border-border/50 flex justify-between items-center">
                                <p className="text-[10px] uppercase text-muted-foreground font-bold">Trading Fee</p>
                                <p className="text-xs font-medium text-primary">{(pool.fee / 100).toFixed(2)}%</p>
                            </div>
                        </div>

                        <div className="space-y-4 mt-2">
                            {!canProvide && (
                                <Alert variant="destructive" className="bg-destructive/10 py-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-xs">
                                        Insufficient balance for {!hasTokenA ? pool.tokenAsymbol : ""} / {!hasTokenB ? pool.tokenBsymbol : ""}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="p-4 rounded-xl border border-border bg-background/50 space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Deposit {pool.tokenAsymbol}</span>
                                    <span>Bal: {userTokenA?.amount || "0.00"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="bg-transparent text-xl font-bold outline-none w-full"
                                        disabled={!hasTokenA}
                                        onChange={(event) => {
                                            settokenAAmount(event.target.value);
                                        }}
                                    />
                                    <img src={pool.tokenAlogo} className="w-6 h-6 rounded-full" />
                                </div>
                            </div>

                            <div className="p-4 rounded-xl border border-border bg-background/50 space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Deposit {pool.tokenBsymbol}</span>
                                    <span>Bal: {userTokenB?.amount || "0.00"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="bg-transparent text-xl font-bold outline-none w-full"
                                        disabled={!hasTokenB}
                                        onChange={(event) => {
                                            settokenBAmount(event.target.value);
                                        }}
                                    />
                                    <img src={pool.tokenBlogo} className="w-6 h-6 rounded-full" />
                                </div>
                            </div>

                            <Button
                                className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20"
                                disabled={!canProvide}
                                onClick={addLiquidity}
                            >
                                {canProvide ? "Add Liquidity" : "Incomplete Pair"}
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};