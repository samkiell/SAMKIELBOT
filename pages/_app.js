import "../styles/globals.css";
import { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import Layout from "../components/Layout";
import Head from "next/head";
import { ThemeProvider } from "../context/ThemeContext";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const AuthProvider = dynamic(
  () => import("../lib/auth").then((mod) => mod.AuthProvider),
  {
    ssr: false,
  },
);

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>SAMKIEL Bot | WhatsApp Bot Deployment Platform</title>
        <meta
          name="description"
          content="Deploy, manage, and monitor WhatsApp bots easily with SAMKIEL Bot Platform."
        />
        <meta
          name="keywords"
          content="WhatsApp bot, bot deployment, SAMKIEL, automation, view once recovery"
        />
        <link rel="icon" href="/logo.png?v=2" />
      </Head>
      <ThemeProvider>
        <AuthProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
              },
            }}
          />
          <SpeedInsights />
          <Analytics />
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}
