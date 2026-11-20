import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, LogIn, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { safeRedirect } from "@/lib/auth-redirect";
import { useServerFn } from "@tanstack/react-start";
import { signInWithUserId } from "@/lib/sign-in.functions";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({ redirect: safeRedirect(s["redirect"]) }),
  head: () => ({ meta: [
    { title: "Sign in — Biorica Visuals" }, { name: "description", content: "Sign in to Biorica Visuals to save detailing creatives and manage the product catalog." },
    { property: "og:title", content: "Biorica Visuals Sign in" }, { property: "og:description", content: "Access your Biorica product library and administration." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "forgot">("signin"); const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const { redirect } = Route.useSearch(); const navigate = useNavigate(); const queryClient = useQueryClient();
  const { data: auth } = useAuth(); const signIn = useServerFn(signInWithUserId);
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
      } else {
        const r = await signIn({ data: { identifier: email, password } });
        if (!r.ok) throw new Error(r.error);
        const { error } = await supabase.auth.setSession({ access_token: r.access_token, refresh_token: r.refresh_token }); if (error) throw error;
        await queryClient.invalidateQueries({ queryKey: ["auth"] });
      }
    } catch (e) { setError(friendly(e)); } finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-md px-4 py-12 sm:py-16">
    <ShieldCheck className="size-10 text-teal" />
    <h1 className="mt-4 text-3xl font-extrabold text-primary">{mode === "forgot" ? "Reset your password" : "Sign in to Biorica Visuals"}</h1>
    <p className="mt-2 text-sm text-muted-foreground">{mode === "forgot" ? "Enter your email to receive a reset link. Users without an email can ask their administrator to reset it." : "Biorica Sciences team portal. Sign in with the User ID (or email) and password from your administrator."}</p>
    <form onSubmit={submit} className="mt-8 space-y-5">
      <div className="space-y-2"><Label htmlFor="email">{mode === "forgot" ? "Email" : "User ID or Email"}</Label><Input id="email" type={mode === "forgot" ? "email" : "text"} autoComplete="username" autoCapitalize="none" placeholder={mode === "forgot" ? "you@biorica.in" : "e.g. BR-MR-01"} required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      {mode !== "forgot" && <div className="space-y-2"><Label htmlFor="password">Password</Label><div className="relative"><Input id="password" type={showPw ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" /><button type="button" className="absolute right-3 top-2.5 text-muted-foreground" aria-label={showPw ? "Hide password" : "Show password"} onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></div>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-teal-soft p-3 text-sm text-teal-strong">{message}</p>}
      <Button type="submit" size="lg" variant="teal" disabled={busy} className="w-full">{busy ? <Loader2 className="animate-spin" /> : mode === "forgot" ? <Mail /> : <LogIn />}{busy ? (mode === "forgot" ? "Sending…" : "Signing in…") : mode === "forgot" ? "Send reset link" : "Sign in"}</Button>
    </form>
    <div className="mt-5 flex justify-center"><Button variant="link" onClick={() => { setMode(mode === "forgot" ? "signin" : "forgot"); setMessage(""); setError(""); }}>{mode === "forgot" ? "Back to sign in" : "Forgot password?"}</Button></div>
    <p className="mt-4 text-center text-xs text-muted-foreground">Need access? Ask your Biorica administrator to create your team login.</p>
  </main>;
}
function friendly(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  if (/banned/i.test(msg)) return "This account is inactive. Please contact your Biorica administrator.";
  if (/invalid login credentials/i.test(msg)) return "Incorrect User ID or password. Please try again.";
  if (/email not confirmed/i.test(msg)) return "This account isn't activated yet. Please contact your administrator.";
  return msg || "Sign-in failed";
}
