import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({ head: () => ({ meta: [
  { title: "Reset password — Biorica Visuals" }, { name: "description", content: "Set a new password for your Biorica Visuals account." },
  { property: "og:title", content: "Biorica Visuals Password Recovery" }, { property: "og:description", content: "Recover access to your Biorica Visuals account." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
] }), component: ResetPassword });
function ResetPassword() {
  const [recovery, setRecovery] = useState(false); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(""); const [done, setDone] = useState(false); const [busy, setBusy] = useState(false);
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get("type") === "recovery") { sessionStorage.setItem("biorica-recovery", "true"); setRecovery(true); }
    else setRecovery(sessionStorage.getItem("biorica-recovery") === "true");
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); if (password !== confirm) { setError("Passwords do not match."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false); if (error) setError(error.message); else { setDone(true); sessionStorage.removeItem("biorica-recovery"); }
  }
  return <main className="mx-auto max-w-md px-4 py-16"><h1 className="text-3xl font-bold">Set a new password</h1>
    {done ? <div className="mt-6"><p role="status">Your password has been updated.</p><Button asChild className="mt-4"><Link to="/">Open AI Studio</Link></Button></div> : recovery ? <form className="mt-6 space-y-4" onSubmit={submit}>
      <Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
      <Label htmlFor="confirm-password">Confirm password</Label><Input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      {error && <p role="alert" className="text-destructive">{error}</p>}<Button type="submit" variant="teal" disabled={busy}>Update password</Button>
    </form> : <div className="mt-6"><p>Open the password reset link from your email.</p><Button asChild variant="outline" className="mt-4"><Link to="/auth">Return to sign in</Link></Button></div>}
  </main>;
}