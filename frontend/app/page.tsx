"use client"

import { AddLiquidityComponent } from "@/components/addLiquidity";
import CreatePool from "@/components/createPool";
import { Navbar } from "@/components/navbar";
import { CreateSwap } from "@/components/swap";
import { TokenSelector } from "@/components/tokenSelector";
import { getPoolsWithNeededMetadata, PoolInfo, PoolWithNeededMetaData } from "@/helper/getAllPool";
import { getTokenMetadata } from "@/helper/getTokenMetadata";
import { getUserTokensInfo, UserTokens } from "@/helper/getUserToken";
import { AddLiquidity } from "@/program/addLiquidity";
import { useProgram } from "@/program/getProgramInstance";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function Home() {
  let wallet = useAnchorWallet();
  const {connection} = useConnection();
  const [token, setToken] = useState<UserTokens[]>([]);
  const [allTokenMetaData, setAllTokenMetadata] = useState<Map<string, any>>();
  const [poolsData, setPoolsData] = useState<PoolWithNeededMetaData[]>();
  const program = wallet ? useProgram(wallet, connection) : null;

  useEffect(() => {
    if (!wallet) {
      console.log("No wallet connected");
      return;
    }

    const accountInfo = async () => {
      const tokenMetadata = await getTokenMetadata();
      setAllTokenMetadata(tokenMetadata);
      const tokens = await getUserTokensInfo(wallet?.publicKey!, connection, tokenMetadata);
      setToken(tokens);
    }
    accountInfo();
  }, [wallet?.publicKey]);


  useEffect(() => {
    if (!program) return;
    if (!allTokenMetaData) return;

    const fetchPools = async () => {
      const poolsWithMetadata = await getPoolsWithNeededMetadata(program, allTokenMetaData);
      setPoolsData(poolsWithMetadata);
    };

    fetchPools();
  }, [program, allTokenMetaData]);

  return (
    <div className="min-h-screen w-screen bg-background text-foreground">
      <Navbar />
      
      <div className="flex flex-col items-center justify-start pt-32 px-4">
        <Tabs defaultValue="swap" className="w-full">
          {/* TAB NAVIGATION */}
          <TabsList className="grid w-full max-w-[500px] mx-auto grid-cols-4 rounded-xl bg-muted/50 p-1 mb-8 ">
            <TabsTrigger value="swap" className="rounded-lg">Swap</TabsTrigger>
            <TabsTrigger value="create" className="rounded-lg text-xs sm:text-sm">Create</TabsTrigger>
            <TabsTrigger value="provide" className="rounded-lg text-xs sm:text-sm">Provide</TabsTrigger>
            <TabsTrigger value="remove" className="rounded-lg text-xs sm:text-sm">Remove</TabsTrigger>
          </TabsList>

          
          <TabsContent value="swap" className="flex justify-center outline-none">
            <CreateSwap />
          </TabsContent>

          
          <TabsContent value="create" className="flex justify-center outline-none">
            <CreatePool tokens={token} />
          </TabsContent>

          <TabsContent value="provide" className="flex justify-center outline-none">
              <AddLiquidityComponent 
                    pools={poolsData!} 
                    userToken={token} 
                    program={program!} 
                    connection={connection}
              />
          </TabsContent>

          <TabsContent value="remove" className="flex justify-center outline-none">
            {/* <RemoveLiquidity /> */}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
