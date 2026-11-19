import { SiteFooter } from "@/components/site-footer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav, TopNav } from "@/components/site-nav";
import { ThemeSync } from "@/components/theme-sync";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    // Each content route sets its own head(). Never add og:image or twitter:image here.
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0F2942" },
      { title: "Biorica Visuals — MR Detailing & AI Visual Aids" },
      { name: "description", content: "Biorica Sciences MR detailing platform: AI visual aids, division catalog, flipbooks and 360° product search." },
      { name: "author", content: "Biorica Sciences Pvt Ltd" },
      { property: "og:title", content: "Biorica Visuals — MR Detailing & AI Visual Aids" },
      { property: "og:description", content: "AI visual aids, division catalog, flipbooks and 360° search for Biorica Sciences MRs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&family=Cormorant+Garamond:wght@600;700&family=Fraunces:wght@600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@500;700&family=Noto+Sans+Devanagari:wght@500;700&family=Noto+Sans+Tamil:wght@500;700&family=Noto+Sans+Kannada:wght@500;700&family=Noto+Sans+Malayalam:wght@500;700&family=Noto+Sans+Bengali:wght@500;700&family=Noto+Sans+Gujarati:wght@500;700&display=swap" },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const immersive = pathname.startsWith("/flipbook");

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      {!immersive && <TopNav />}
      <div className={immersive ? "" : "pb-safe-nav md:pb-0"}>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </div>
      {!immersive && <SiteFooter />}
      {!immersive && <BottomNav />}
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
