import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { getUserAccountInfo, UserTokens } from "@/helper/getAccountInfo"
import { useWallet } from "@solana/wallet-adapter-react"

export const CreateSwap = () => {
    let wallet = useWallet();
    const [token, setToken] = useState<UserTokens[]>([]);
    useEffect(()=>{
        const accountInfo = async ()=> {
            const tokens = await getUserAccountInfo("6KpVFh4ehrWZoWNaNWWsd4MitZ9axhybgS6CXdNiUP1V");
            setToken(tokens);
        }
        accountInfo();
    },[])

    return (
    <Card className="w-full max-w-[440px] bg-card shadow-2xl backdrop-blur-xl">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">Swap</CardTitle>

          <span className="text-xs font-medium px-2 py-1 rounded-full bg-accent text-accent-foreground">
            0.3% Fee
          </span>
        </div>

        <CardDescription>
          Instant token exchange
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 mt-4">

        {/* FROM TOKEN */}
        <div className="p-4 rounded-2xl border border-border space-y-2 bg-muted/40 mb-4">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>From</span>
            <span>Balance: 100.00</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <input
              type="number"
              placeholder="0.00"
              className="bg-transparent text-2xl font-semibold outline-none w-full"
            />
          </div>
        </div>

        {/* ARROW */}
        <div className="flex justify-center -my-3 relative z-10">
          <div className="bg-card p-2 rounded-xl border border-border cursor-pointer hover:bg-accent transition">
            <ArrowDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* TO TOKEN */}
        <div className="p-4 rounded-2xl border border-border space-y-2 bg-muted/40 mt-4">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>To (Estimate)</span>
            <span>Balance: 0.00</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <input
              disabled
              type="number"
              placeholder="0.00"
              className="bg-transparent text-2xl font-semibold outline-none w-full text-muted-foreground cursor-not-allowed"
            />

            <button className="px-3 py-1.5 rounded-xl flex items-center gap-2 border border-border min-w-[100px] hover:bg-accent transition">
            </button>
          </div>
        </div>

      </CardContent>

      <CardFooter className="flex flex-col gap-3 mt-4">
        <Button className="w-full uppercase">
          Swap
        </Button>
      </CardFooter>
    </Card>
  )
}