"use client";

import SessionProviderComponent from "./components/authsessionprovider.component";
import NavBar from "./components/navbar.component";
import { QueryClientProvider, QueryClient } from "react-query";
import { createGlobalStyle } from "styled-components";


const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  html, body {
    width: 100%;
    height: 100%;
    background-color: black;
    overflow: hidden;
  }
`;

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProviderComponent>
        <html lang="en">
          <body>
            <GlobalStyle />
            <NavBar />
            {children}
          </body>
        </html>
      </SessionProviderComponent>
    </QueryClientProvider>
  );
}
