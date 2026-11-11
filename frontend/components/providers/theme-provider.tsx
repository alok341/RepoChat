"use client"

import * as React from "react"
import dynamic from "next/dynamic"

// 👇 Load the ThemeProvider only on the client side to avoid SSR crashes
const NextThemesProvider = dynamic(
  () => import("next-themes").then((mod) => mod.ThemeProvider),
  { ssr: false }
)

export function ThemeProvider({
  children,
  ...props
}: {
  children: React.ReactNode;
  [key: string]: any;
}) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}