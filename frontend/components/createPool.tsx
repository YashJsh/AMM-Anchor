"use client"

import { useProgram } from "@/program/getProgramInstance";
import { InitializePool } from "@/program/initialize_pool";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { TokenSelector } from "./tokenSelector";
import { UserTokens } from "@/helper/getUserToken";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { AddLiquidity } from "@/program/addLiquidity";
import { PublicKey } from "@solana/web3.js";
import { getExplorerLink } from "@/helper/explorerHelper";



export default function CreatePool({ tokens, onTransactionComplete }: { tokens: UserTokens[]; onTransactionComplete?: () => Promise<void> }) {
    const wallet = useWallet();
    const anchorWallet = useAnchorWallet();
    const { connection } = useConnection();

    const [tokenA, setTokenA] = useState("");
    const [tokenB, setTokenB] = useState("");
    const [inputtokenA, setInputTokenA] = useState("");
    const [inputTokenB, setInputTokenB] = useState("");
    const [fee, setFee] = useState(3);

    if (!anchorWallet) {
        return null;
    }
    const program = useProgram(anchorWallet, connection);
    const handleCreate = async () => {
        if (!program) {
            return;
        }
        if (tokenA == tokenB) {
            toast.error("Pool can't be of same tokens");
            return;
        }
        if (!inputtokenA || !inputTokenB) {
            toast.error("Enter liquidity amounts");
            return;
        }
        try {
            console.log("Control Reached in Initialized Pool");
            const initResult = await InitializePool(
                program,
                tokenA,
                tokenB,
                fee,
                wallet
            )
            console.log("Pool Initialized : ", initResult);
            
            const liquidity = await AddLiquidity(program, new PublicKey(tokenA), new PublicKey(tokenB), Number(inputtokenA), Number(inputTokenB), tokens, wallet, connection);
            
            const explorerUrl = getExplorerLink(liquidity.signature, "devnet");
            
            toast.success("Pool created and liquidity added", {
                action: {
                    label: "View Tx",
                    onClick: () => window.open(explorerUrl, '_blank')
                }
            });
            
            if (onTransactionComplete) {
                await onTransactionComplete();
            }
        } catch (error) {
            toast.error("Failed creating pool");
            console.error(error);
        }

    }

    return (
        <div>
            <Card className="w-full max-w-[440px] bg-card shadow-2xl backdrop-blur-xl">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-xl font-bold">Create Pool</CardTitle>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                            V2 LP
                        </span>
                    </div>
                    <CardDescription>
                        Provide liquidity to earn trading fees
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 mt-4">

                    {/* TOKEN A INPUT */}
                    <div className="p-4 rounded-2xl border border-border space-y-2 bg-muted/40">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Input Token A</span>
                            <span>Balance: {tokens.find((t) => t.mint === tokenA)?.amount}</span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <input
                                type="number"
                                placeholder="0.00"
                                className="bg-transparent text-2xl font-semibold outline-none w-full"
                                onChange={(e) => {
                                    setInputTokenA(e.target.value)
                                }}
                            />
                            <TokenSelector tokens={tokens} value={tokenA} onValueChange={setTokenA} />
                        </div>
                    </div>


                    {/* TOKEN B INPUT */}
                    <div className="p-4 rounded-2xl border border-border space-y-2 bg-muted/40">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Input Token B</span>
                            <span>Balance: {tokens.find((t) => t.mint === tokenB)?.amount}</span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <input
                                type="number"
                                placeholder="0.00"
                                className="bg-transparent text-2xl font-semibold outline-none w-full"
                                onChange={(e) => {
                                    setInputTokenB(e.target.value)
                                }}
                            />
                            <TokenSelector tokens={tokens} value={tokenB} onValueChange={setTokenB} />
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 mt-4">
                    <Button
                        className="w-full uppercase font-bold py-6"
                        disabled={!tokenA || !tokenB}
                        onClick={() => {
                            handleCreate()
                        }}
                    >
                        {wallet.publicKey ? "Initialize Pool" : "Connect Wallet"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}