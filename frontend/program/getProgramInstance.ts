import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor"
import idl from "../../target/idl/amm.json"
import { AnchorWallet } from "@solana/wallet-adapter-react"
import { Connection } from "@solana/web3.js";
import { Amm } from "../../target/types/amm";

export const getProgramInstance = (wallet : AnchorWallet, connection : Connection) => {
    if (!wallet){
        console.log("No wallet connected")
        return;
    }
    const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });

    return new Program<Amm>(idl as Amm, provider)
}