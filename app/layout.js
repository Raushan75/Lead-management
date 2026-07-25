import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'
import Footer from '@/components/footer'

export const metadata = {
  title: 'LeadHub — Lead Management Platform',
  description: 'Capture, qualify and close leads. Built for Digital Heroes.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col">
        <Providers>
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  )
}
