import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { AuthProvider } from "@/lib/auth-context"
import { NotificationProvider } from "@/lib/notification-context"
import { SocketProvider } from "@/lib/socket-context"
import { config } from "@/lib/config"

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
})

const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-playfair",
})

export const metadata: Metadata = {
  title: `${config.app.name} - Kết Nối Tương Lai`,
  description: config.app.description,
  generator: 'v0.app',
  icons: {
    icon: '/logo.png',
    shortcut: '/favicon.ico',
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        <NotificationProvider>
          <AuthProvider>
            <SocketProvider>
              <Header />
              <main>{children}</main>
              <Footer />
            </SocketProvider>
          </AuthProvider>
        </NotificationProvider>
      </body>
    </html>
  )
}
