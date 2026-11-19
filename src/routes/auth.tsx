import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, LogIn, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { safeRedirect } from "@/lib/auth-redirect";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({ redirect: safeRedirect(s["redirect"]) }),
  head: () => ({ meta: [
    { title: "Sign in — Biorica Visuals" }, { name: "description", content: "Sign in to Biorica Visuals to save detailing creatives and manage the product catalog." },
    { property: "og:title", content: "Biorica Visuals Sign in" }, { property: "og:description", content: "Access your Biorica product library and administration." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const { redirect } = Route.useSearch(); const navigate = useNavigate(); const queryClient = useQueryClient();
  const { data: auth } = useAuth();
  useEffect(() => {
    if (!auth?.user) return;
    const pending = sessionStorage.getItem("biorica-auth-return");
    sessionStorage.removeItem("biorica-auth-return");
    navigate({ to: safeRedirect(pending ?? redirect) });
  }, [auth?.user, redirect, navigate]);
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error; setMessage("Check your email for a password reset link.");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        if (!data.session) setMessage("Check your email to confirm your account, then sign in.");
        else await queryClient.invalidateQueries({ queryKey: ["auth"] });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error;
        await queryClient.invalidateQueries({ queryKey: ["auth"] });
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Sign-in failed"); } finally { setBusy(false); }
  }
  async function social(provider: "google" | "lovable") {
    setBusy(true); setError(""); sessionStorage.setItem("biorica-auth-return", safeRedirect(redirect));
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth` });
      if (result.error) throw result.error;
      await queryClient.invalidateQueries({ queryKey: ["auth"] });
    } catch (e) { setError(e instanceof Error ? e.message : "Sign-in failed"); } finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-md px-4 py-12 sm:py-16">
    <ShieldCheck className="size-10 text-teal" />
    <h1 className="mt-4 text-3xl font-extrabold text-primary">{mode === "signup" ? "Join Biorica Visuals" : mode === "forgot" ? "Reset your password" : "Sign in to Biorica Visuals"}</h1>
    <form onSubmit={submit} className="mt-8 space-y-5">
      <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      {mode !== "forgot" && <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" minLength={mode === "signup" ? 8 : undefined} autoComplete={mode === "signup" ? "new-password" : "current-password"} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-teal-soft p-3 text-sm text-teal-strong">{message}</p>}
      <Button type="submit" size="lg" variant="teal" disabled={busy} className="w-full">{busy ? <Loader2 className="animate-spin" /> : mode === "forgot" ? <Mail /> : <LogIn />}{mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}</Button>
    </form>
    {mode !== "forgot" && <div className="mt-5 grid gap-2"><Button variant="outline" disabled={busy} onClick={() => social("google")}>Continue with Google</Button><Button variant="outline" disabled={busy} onClick={() => social("lovable")}>Sign in with Lovable</Button></div>}
    <div className="mt-5 flex flex-wrap justify-center gap-2"><Button variant="link" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMessage(""); setError(""); }}>{mode === "signup" ? "Already have an account? Sign in" : "Create account"}</Button>{mode !== "signup" && <Button variant="link" onClick={() => { setMode(mode === "forgot" ? "signin" : "forgot"); setMessage(""); setError(""); }}>{mode === "forgot" ? "Back to sign in" : "Forgot password?"}</Button>}</div>
  </main>;
}