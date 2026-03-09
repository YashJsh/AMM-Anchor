import { PoolInfo, PoolWithNeededMetaData } from "@/helper/getAllPool";
import { useProgram } from "@/program/getProgramInstance"
import { InitializePool } from "@/program/initialize_pool";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Badge, Droplets, Plus } from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import { SpecificPool } from "./poolDetail";
import { UserTokens } from "@/helper/getUserToken";
import { Program } from "@coral-xyz/anchor";
import { Amm } from "../../target/types/amm";
import { connection } from "next/server";
import { Connection } from "@solana/web3.js";


export const AddLiquidityComponent = ({ pools, userToken, program, connection }: { pools: PoolWithNeededMetaData[] , userToken : UserTokens[], program : Program<Amm>, connection : Connection}) => {
    const [selectedPool, setSelectedPool] = useState<PoolWithNeededMetaData | null>(null);

    return (
        <Card className="w-full max-w-[600px] bg-card shadow-2xl backdrop-blur-xl border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                    <CardTitle className="text-2xl font-bold">Liquidity Pools</CardTitle>
                    <CardDescription>
                        Select a pair to provide liquidity and earn rewards.
                    </CardDescription>
                </div>

            </CardHeader>

            <CardContent className="space-y-4">
                {!pools ? (
                    <div className="py-10 text-center text-muted-foreground border border-dashed rounded-2xl">
                        No active pools found.
                    </div>
                ) : (
                    pools.map((pool) => (
                        <div
                            key={pool.publicKey.toBase58()}
                            className="group p-4 rounded-2xl border border-border bg-muted/20 hover:bg-muted/40 transition-all flex items-center justify-between"
                            onClick={() => {
                                setSelectedPool(pool)
                            }}
                        >
                            <div className="flex items-center gap-4">
                                {/* Visual indicator for the pair */}
                                <div className="flex -space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center border-2 border-card text-[10px] font-bold">
                                        {pool.tokenAsymbol}
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center border-2 border-card text-[10px] font-bold">
                                        {pool.tokenBsymbol}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg">
                                            {pool.tokenAsymbol} / {pool.tokenBsymbol}
                                        </h3>
                                        <Badge className="text-[10px] px-1.5 py-0">
                                            {pool.fee}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-mono">
                                        {pool.publicKey.toBase58()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">TVL</p>
                                    <p className="font-semibold text-sm"></p>
                                </div>
                                <Button size="sm" variant="outline" className="h-8 gap-2 hover:bg-primary hover:text-primary-foreground transition-colors">
                                    <Droplets className="w-3.5 h-3.5" />
                                    Add
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>

            {selectedPool && <SpecificPool 
                pool={selectedPool} 
                onClose={() => setSelectedPool(null)} 
                userTokens={userToken} 
                program={program}
                connection={connection}
            />}
        </Card>
    )
}