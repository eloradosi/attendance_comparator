import type { AppProps, AppContext } from "next/app";
import App from "next/app";
import { Inter } from "next/font/google";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import "@/globals.css";
import SlideLoader from "@/components/SlideLoader";

const inter = Inter({ subsets: ["latin"] });

function MyApp({ Component, pageProps }: AppProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    let loadingStartTime: number | null = null;
    let debounceTimer: NodeJS.Timeout | null = null;
    let minDisplayTimer: NodeJS.Timeout | null = null;

    const handleStartLoading = (e: any) => {
      // Debounce: hanya tampilkan loader jika loading > 300ms
      debounceTimer = setTimeout(() => {
        loadingStartTime = Date.now();
        setIsLoading(true);
        setLoadingMessage(e.detail?.message || "Loading...");
      }, 300);
    };

    const handleStopLoading = () => {
      // Clear debounce jika loading selesai sebelum 300ms
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }

      // Jika loader sudah muncul, pastikan minimal tampil 600ms
      if (loadingStartTime) {
        const elapsed = Date.now() - loadingStartTime;
        const remaining = Math.max(0, 600 - elapsed);

        minDisplayTimer = setTimeout(() => {
          setIsLoading(false);
          setLoadingMessage("");
          loadingStartTime = null;
        }, remaining);
      }
    };

    window.addEventListener("app:loading:start", handleStartLoading);
    window.addEventListener("app:loading:stop", handleStopLoading);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (minDisplayTimer) clearTimeout(minDisplayTimer);
      window.removeEventListener("app:loading:start", handleStartLoading);
      window.removeEventListener("app:loading:stop", handleStopLoading);
    };
  }, []);

  // Handle compile/HMR loading
  useEffect(() => {
    const handleRouteChangeStart = () => {
      setIsLoading(true);
      setLoadingMessage("Loading page...");
    };

    const handleRouteChangeComplete = () => {
      setIsLoading(false);
      setLoadingMessage("");
    };

    const handleRouteChangeError = () => {
      setIsLoading(false);
      setLoadingMessage("");
    };

    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);
    router.events.on("routeChangeError", handleRouteChangeError);

    // Detect webpack HMR (Hot Module Replacement) during development
    if (
      process.env.NODE_ENV === "development" &&
      typeof window !== "undefined"
    ) {
      let hmrTimeout: NodeJS.Timeout;

      const checkHMR = () => {
        // @ts-ignore - webpack HMR API
        if (module.hot) {
          // @ts-ignore
          const originalDispose = module.hot.dispose;
          // @ts-ignore
          module.hot.dispose = (data: any) => {
            setIsLoading(true);
            setLoadingMessage("Compiling changes...");
            if (originalDispose) originalDispose(data);
          };

          // @ts-ignore
          const originalAccept = module.hot.accept;
          // @ts-ignore
          module.hot.accept = (...args: any[]) => {
            hmrTimeout = setTimeout(() => {
              setIsLoading(false);
              setLoadingMessage("");
            }, 500);
            if (originalAccept) originalAccept(...args);
          };
        }
      };

      checkHMR();

      return () => {
        clearTimeout(hmrTimeout);
      };
    }

    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
      router.events.off("routeChangeError", handleRouteChangeError);
    };
  }, [router]);

  return (
    <main className={`${inter.className} min-h-screen`}>
      <SlideLoader isLoading={isLoading} message={loadingMessage} />
      <Component {...pageProps} />
    </main>
  );
}

MyApp.getInitialProps = async (appContext: AppContext) => {
  // Call page's getInitialProps and get initial props
  const appProps = await App.getInitialProps(appContext);

  // Add any app-level server-side data here
  // Note: This runs on every page request (SSR)

  return { ...appProps };
};

export default MyApp;
