import { UserTokens } from "@/helper/getUserToken";

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export const TokenSelector = ({ tokens, value, onValueChange }: { tokens: UserTokens[]; value: string; onValueChange: (value: string) => void }) => {
    return <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="SelectToken" />
        </SelectTrigger>
        <SelectContent>
            <SelectGroup>
                {tokens.map((token) => (
                    <SelectItem key={token.mint} value={token.mint}>
                        <div className="flex items-center gap-2">
                            <span>{token.symbol}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectGroup>
        </SelectContent>
    </Select>

}