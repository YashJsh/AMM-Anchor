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
    <div className="h-screen w-screen">
      <Navbar />
      <div className="flex items-center justify-center mt-40">
        {/* <CreateSwap />
        <CreatePool tokens={token}/> */}
        <AddLiquidityComponent pools={poolsData!} userToken={token} program={program!} connection={connection}/>
      </div>
    </div>
  );
}
