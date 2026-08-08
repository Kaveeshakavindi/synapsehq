import { Logo } from '@/components/logo'

export function AuthShell({
  children,
  width = 'md',
}: {
  children: React.ReactNode
  width?: 'md' | 'lg'
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <Logo />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div
          className="w-full"
          style={{ maxWidth: width === 'lg' ? 620 : 520 }}
        >
          {children}
        </div>
      </main>
    </div>
  )
}
