"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import dynamic from "next/dynamic";

// 1. Create a dynamic version that skips SSR
const NextThemesProviderNoSSR = dynamic(
  () => import("next-themes").then((mod) => mod.ThemeProvider),
  { ssr: false }
);

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  // 2. Use the dynamic version
  return <NextThemesProviderNoSSR {...props}>{children}</NextThemesProviderNoSSR>;
}