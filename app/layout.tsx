import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "KEEP",
  description: "Keep your bookmark!",
};

import {
  Noto_Sans_KR,
  Noto_Serif_KR,
  Montserrat,
  Do_Hyeon,
  Geist,
  Geist_Mono,
} from 'next/font/google';

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['100', '400', '700', '900'],
  variable: '--font-noto-sans',
});
const notoSerifKr = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['200', '400', '700', '900'],
  variable: '--font-noto-serif',
});
const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
});
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['100', '400', '700', '900'],
  variable: '--font-montserrat',
});
const doHyeon = Do_Hyeon({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-do-hyeon',
});

import "./globals.css";
import { ThemeProvider } from "@/components/app/theme-provider"
import { Toaster } from "@/components/ui/sonner"

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="ko" 
      className={[
        notoSansKr.variable,
        notoSerifKr.variable,
        geist.variable,
        geistMono.variable,
        montserrat.variable,
        doHyeon.variable
      ].join(' ')} 
      suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div id="app">
            {children}
          </div>

          <Toaster 
            position="top-center" 
            toastOptions={{
              classNames: {
                toast: 'font-body',
              },
            }} 
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
