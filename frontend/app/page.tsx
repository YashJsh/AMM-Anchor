"use client"

import CreatePool from "@/components/createPool";
import { Navbar } from "@/components/navbar";
import { CreateSwap } from "@/components/swap";
import { TokenSelector } from "@/components/tokenSelector";
import { getTokenMetadata } from "@/helper/getTokenMetadata";
import { getUserTokensInfo, UserTokens } from "@/helper/getUserToken";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

export default function Home() {
  let wallet = useAnchorWallet();
  const connection = useConnection();
  const [token, setToken] = useState<UserTokens[]>([]);

  useEffect(() => {
    if (!wallet) {
      console.log("No wallet connected");
      return;
    }
   
    const accountInfo = async () => {
      const data = await getTokenMetadata();
      const tokens = await getUserTokensInfo(wallet?.publicKey!, connection.connection, data);
      setToken(tokens);
      getTokenMetadata();
    }
    accountInfo();
  }, [wallet?.publicKey]);

  return (
    <div className="h-screen w-screen">
      <Navbar />
      <div className="flex items-center justify-center mt-40">
        <CreateSwap />
        <CreatePool tokens={token}/>
      </div>
    </div>
  );
}
