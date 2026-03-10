"use client"

import { AddLiquidityComponent } from "@/components/addLiquidity";
import CreatePool from "@/components/createPool";
import { Navbar } from "@/components/navbar";
import { CreateSwap } from "@/components/swap";
import { getPoolsWithNeededMetadata, PoolWithNeededMetaData } from "@/helper/getAllPool";
import { getTokenMetadata } from "@/helper/getTokenMetadata";
import { getUserTokensInfo, UserTokens } from "@/helper/getUserToken";
import { useProgram } from "@/program/getProgramInstance";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react"; 

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { RemoveLiquidity } from "@/components/removeLiquidity";

export default function Home() {
  const { connection } = useConnection();
  const { connecting, connected } = useWallet();
  const wallet = useAnchorWallet();
  
  const [token, setToken] = useState<UserTokens[]>([]);
  const [allTokenMetaData, setAllTokenMetadata] = useState<Map<string, any>>();
  const [poolsData, setPoolsData] = useState<PoolWithNeededMetaData[]>();
  const [isLoadingData, setIsLoadingData] = useState(false);

  const program = wallet ? useProgram(wallet, connection) : null;

  // Function to refresh user tokens
  const fetchUserTokens = async () => {
    if (!wallet) return;
    try {
      const tokenMetadata = await getTokenMetadata();
      setAllTokenMetadata(tokenMetadata);
      const tokens = await getUserTokensInfo(wallet.publicKey, connection, tokenMetadata);
      setToken(tokens);
    } catch (e) {
      console.error("Error fetching tokens:", e);
    }
  };

  // Function to refresh pools
  const fetchPools = async () => {
    if (!program || !allTokenMetaData) return;
    try {
      const poolsWithMetadata = await getPoolsWithNeededMetadata(program, connection, allTokenMetaData);
      setPoolsData(poolsWithMetadata);
    } catch (e) {
      console.error("Error fetching pools:", e);
    }
  };

  // Main refresh function to call both
  const refreshData = async () => {
    await fetchUserTokens();
    await fetchPools();
  };

  useEffect(() => {
    if (!wallet) {
      setToken([]);
      return;
    }

    const accountInfo = async () => {
      setIsLoadingData(true);
      try {
        const tokenMetadata = await getTokenMetadata();
        setAllTokenMetadata(tokenMetadata);
        const tokens = await getUserTokensInfo(wallet.publicKey, connection, tokenMetadata);
        setToken(tokens);
      } catch (e) {
        console.error("Error fetching account info:", e);
      } finally {
        setIsLoadingData(false);
      }
    }
    accountInfo();
  }, [wallet, connection]);

  useEffect(() => {
    if (!program || !allTokenMetaData) return;

    const fetchPoolsData = async () => {
      const poolsWithMetadata = await getPoolsWithNeededMetadata(program, connection, allTokenMetaData);
      setPoolsData(poolsWithMetadata);
    };

    fetchPoolsData();
  }, [allTokenMetaData]);

  // --- LOADING RENDER ---
  if (connecting || (connected && isLoadingData && token.length === 0)) {
    return (
      <div className="min-h-screen w-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-xl font-medium text-foreground">
          {connecting ? "Connecting to Wallet..." : "Fetching Chain Data..."}
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-background text-foreground">
      <Navbar />
      
      <div className="flex flex-col items-center justify-start pt-32 px-4">
        {!connected ? (
          <div className="text-center p-10 border border-dashed rounded-xl bg-muted/20">
            <h2 className="text-lg font-semibold">Wallet Not Connected</h2>
            <p className="text-muted-foreground">Please connect your wallet to use the Swap & Liquidity features.</p>
          </div>
        ) : (
          <Tabs defaultValue="swap" className="w-full">
            <TabsList className="grid w-full max-w-[500px] mx-auto grid-cols-4 rounded-xl bg-muted/50 p-1 mb-8 ">
              <TabsTrigger value="swap" className="rounded-lg">Swap</TabsTrigger>
              <TabsTrigger value="create" className="rounded-lg text-xs sm:text-sm">Create</TabsTrigger>
              <TabsTrigger value="provide" className="rounded-lg text-xs sm:text-sm">Provide</TabsTrigger>
              <TabsTrigger value="remove" className="rounded-lg text-xs sm:text-sm">Remove</TabsTrigger>
            </TabsList>
            
            <TabsContent value="swap" className="flex justify-center outline-none">
              <CreateSwap userTokens={token} program={program!} poolData={poolsData!} onTransactionComplete={refreshData} />
            </TabsContent>

            <TabsContent value="create" className="flex justify-center outline-none">
              <CreatePool tokens={token} onTransactionComplete={refreshData} />
            </TabsContent>

            <TabsContent value="provide" className="flex justify-center outline-none">
                <AddLiquidityComponent pools={poolsData!} userToken={token} program={program!} connection={connection} onTransactionComplete={refreshData} />
            </TabsContent>

            <TabsContent value="remove" className="flex justify-center outline-none">
              <RemoveLiquidity pools={poolsData!} userTokens={token} program={program!} onTransactionComplete={refreshData} />
            </TabsContent>
          </Tabs> 
        )}
      </div>
    </div>
  );
}