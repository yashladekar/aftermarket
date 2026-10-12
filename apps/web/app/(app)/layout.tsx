import { AftermarketSessionProvider } from "@/components/aftermarket/session-provider"
import { AftermarketStoreProvider } from "@/lib/aftermarket-store"
import { requireSession } from "@/lib/session"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireSession()
  return (
    <AftermarketSessionProvider session={session}>
      <AftermarketStoreProvider>{children}</AftermarketStoreProvider>
    </AftermarketSessionProvider>
  )
}
