"use client"

import { Navbar } from "@/components/navbar";
import { CreateSwap } from "@/components/swap";

export default function Home() {
  
  return (
    <div className="h-screen w-screen">
      <Navbar/>
      <div className="flex items-center justify-center mt-40">
        <CreateSwap/>
      </div>
    </div>
  );
}
