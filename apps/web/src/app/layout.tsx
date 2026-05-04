import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { NavigationProgress } from '@/components/layout/navigation-progress'

export const metadata: Metadata = {
  title: 'Elyon Hub',
  description: 'CRM Conversacional WhatsApp-first · Natan Sousa Tech',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          <NavigationProgress />
          {children}
        </Providers>
      </body>
    </html>
  )
}
