"use client";


import { SessionProvider } from "next-auth/react";
import { PropsWithChildren } from "react";

export default function SessionProviderComponent({
  children,
}: PropsWithChildren) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
