export function getExplorerLink(signature: string, cluster: string = "devnet"): string {
  const baseUrl = "https://explorer.solana.com"
  return `${baseUrl}/tx/${signature}?cluster=${cluster}`
}
