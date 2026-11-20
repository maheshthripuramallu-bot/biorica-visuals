import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Eye, EyeOff, KeyRound, Loader2, Plus, Save, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { TEAM_ROLES, parseQuickAdd, resolvePassword, teamCapacity, type TeamRole } from "@/lib/team";
import { createTeamUsers, deleteTeamUser, updateTeamUser } from "@/lib/team.functions";

const selectClass = "h-10 w-full rounded-md border border-input bg-card px-3 text-sm";
type Member = { id: string; login_id: string | null; full_name: string; email: string; role: string; territory: string; is_active: boolean };
const blank = { login_id: "", full_name: "", email: "", role: "mr" as TeamRole, territory: "", password: "" };
const roleLabel = (r: string) => TEAM_ROLES.find((x) => x.value === r)?.label ?? r;

export function TeamManager() {
  const qc = useQueryClient();
  const create = useServerFn(createTeamUsers); const update = useServerFn(updateTeamUser); const del = useServerFn(deleteTeamUser);
  const { data } = useQuery({ queryKey: ["team"], queryFn: async () => {
    const [m, s] = await Promise.all([supabase.from("team_members").select("*").order("created_at"), supabase.from("team_settings").select("*").eq("id", "official").maybeSingle()]);
    if (m.error) throw m.error; return { members: m.data as Member[], settings: s.data };
  } });
  const members = data?.members ?? []; const cap = teamCapacity(members.filter((m) => m.is_active).length, data?.settings?.target_users ?? 10);
  const [defaultPw, setDefaultPw] = useState<string | null>(null); const pw = defaultPw ?? data?.settings?.default_password ?? "";
  const [showDefault, setShowDefault] = useState(false);
  const [form, setForm] = useState<(typeof blank & { id?: string }) | null>(null); const [showPw, setShowPw] = useState(false);
  const [quick, setQuick] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ email: string; password: string }[]>([]);
  const [q, setQ] = useState(""); const [roleF, setRoleF] = useState(""); const [statusF, setStatusF] = useState("");
  const [busy, setBusy] = useState(false); const [remove, setRemove] = useState<Member | null>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["team"] }); qc.invalidateQueries({ queryKey: ["team-status"] }); };
  async function run(fn: () => Promise<void>) { setBusy(true); try { await fn(); refresh(); } catch (e) { toast.error(e instanceof Error ? e.message : "Something went wrong"); } finally { setBusy(false); } }
  const copy = (t: string) => { void navigator.clipboard.writeText(t); toast.success("Copied"); };

  const saveDefault = () => run(async () => {
    if (pw && pw.length < 8) throw new Error("Default password must be at least 8 characters.");
    const { error } = await supabase.from("team_settings").upsert({ id: "official", default_password: pw, updated_at: new Date().toISOString() }); if (error) throw error;
    setDefaultPw(null); toast.success("Default password saved");
  });
  const saveUser = () => form && run(async () => {
    if (form.id) {
      await update({ data: { id: form.id, login_id: form.login_id, full_name: form.full_name, email: form.email, role: form.role, territory: form.territory, ...(form.password ? { password: form.password } : {}) } });
      if (form.password) setIssued([{ email: form.login_id || form.email, password: form.password }]);
      toast.success("User updated");
    } else {
      const password = resolvePassword(form.password, pw);
      const [r] = await create({ data: { users: [{ ...form, password }] } });
      if (!r?.ok) throw new Error(r?.error ?? "Could not create user");
      setIssued([{ email: r.email, password }]); toast.success("User created — they can sign in now");
    }
    setForm(null);
  });
  const quickAdd = () => quick !== null && run(async () => {
    const password = resolvePassword("", pw); const rows = parseQuickAdd(quick);
    const res = await create({ data: { users: rows.map((r) => ({ ...r, password })) } });
    const ok = res.filter((r) => r.ok); setIssued(ok.map((r) => ({ email: r.email, password })));
    res.filter((r) => !r.ok).forEach((r) => toast.error(`${r.email}: ${r.error}`));
    if (ok.length) toast.success(`${ok.length} users created`); if (ok.length === res.length) setQuick(null);
  });
  const shown = members.filter((m) => `${m.login_id ?? ""} ${m.full_name} ${m.email} ${m.territory}`.toLowerCase().includes(q.toLowerCase()) && (!roleF || m.role === roleF) && (!statusF || String(m.is_active) === statusF));

  return <div className="space-y-6">
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="flex items-center gap-2 text-xl font-bold"><Users className="size-5 text-teal"/>Team Users & Access</h2><p className="mt-1 text-sm text-muted-foreground">Active users: <b className="text-foreground">{cap.active} / {cap.target}</b> projected · {cap.remaining} seats left in the rollout</p></div>
        <div className="flex flex-wrap gap-2"><Button onClick={() => { setForm({ ...blank }); setShowPw(false); }}><UserPlus/>Add user</Button><Button variant="outline" onClick={() => setQuick("")}><Plus/>Bulk / Quick add</Button></div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={cap.percent} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-teal transition-all" style={{ width: `${cap.percent}%` }}/></div>
    </section>

    <section className="rounded-lg border border-border bg-card p-5">
      <Label htmlFor="default-pw" className="flex items-center gap-2"><KeyRound className="size-4"/>Default user password</Label>
      <p className="mt-1 text-xs text-muted-foreground">Pre-filled for every new user unless you type a custom one. Ask users to change it after first sign-in.</p>
      <div className="mt-2 flex max-w-lg gap-2"><div className="relative flex-1"><Input id="default-pw" type={showDefault ? "text" : "password"} value={pw} onChange={(e) => setDefaultPw(e.target.value)} placeholder="At least 8 characters"/><button type="button" className="absolute right-2 top-2.5 text-muted-foreground" aria-label={showDefault ? "Hide password" : "Show password"} onClick={() => setShowDefault(!showDefault)}>{showDefault ? <EyeOff className="size-4"/> : <Eye className="size-4"/>}</button></div><Button variant="outline" size="icon" aria-label="Copy default password" disabled={!pw} onClick={() => copy(pw)}><Copy/></Button><Button onClick={saveDefault} disabled={busy}><Save/>Save</Button></div>
    </section>

    {issued.length > 0 && <section className="rounded-lg border border-teal bg-card p-5" role="status">
      <div className="flex items-center justify-between"><h3 className="font-bold">Sign-in details to share</h3><Button variant="ghost" size="sm" onClick={() => setIssued([])}>Dismiss</Button></div>
      <p className="text-xs text-muted-foreground">Shown once — passwords aren't stored readable. Use "Reset password" to issue a new one later.</p>
      <div className="mt-2 divide-y divide-border">{issued.map((i) => <div key={i.email} className="flex flex-wrap items-center gap-3 py-2 text-sm"><span className="flex-1 font-medium">{i.email}</span><code className="rounded bg-muted px-2 py-1">{i.password}</code><Button variant="ghost" size="icon" aria-label={`Copy login for ${i.email}`} onClick={() => copy(`User ID: ${i.email}\nPassword: ${i.password}\nSign in: ${window.location.origin}/auth`)}><Copy/></Button></div>)}</div>
    </section>}

    <section>
      <div className="flex flex-wrap gap-3"><Input aria-label="Search users" placeholder="Search User ID, name, email, territory" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm"/>
        <select aria-label="Filter by role" className="h-10 rounded-md border border-input bg-card px-3 text-sm" value={roleF} onChange={(e) => setRoleF(e.target.value)}><option value="">All roles</option>{TEAM_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select>
        <select aria-label="Filter by status" className="h-10 rounded-md border border-input bg-card px-3 text-sm" value={statusF} onChange={(e) => setStatusF(e.target.value)}><option value="">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></select></div>
      <div className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">{shown.map((m) => <div key={m.id} className="flex flex-wrap items-center gap-3 p-4">
        <div className="min-w-0 flex-1"><p className="font-bold">{m.full_name}</p><p className="break-all text-sm text-muted-foreground">{m.login_id && <span className="mr-2 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">{m.login_id}</span>}{m.email}</p><p className="mt-1 text-xs text-teal-strong">{roleLabel(m.role)}{m.territory && ` · ${m.territory}`}</p></div>
        <label className="flex items-center gap-2 text-sm"><Switch checked={m.is_active} disabled={busy} aria-label={`${m.full_name} active`} onCheckedChange={(v) => run(async () => { await update({ data: { id: m.id, is_active: v } }); toast.success(v ? "Activated" : "Deactivated — can't sign in"); })}/>{m.is_active ? "Active" : "Inactive"}</label>
        <Button variant="ghost" size="sm" disabled={busy || !pw} title="Reset to default password" onClick={() => run(async () => { await update({ data: { id: m.id, password: pw } }); setIssued([{ email: m.login_id || m.email, password: pw }]); toast.success("Password reset to default"); })}><KeyRound/>Reset password</Button>
        <Button variant="ghost" size="sm" onClick={() => { setForm({ id: m.id, login_id: m.login_id ?? "", full_name: m.full_name, email: m.email, role: m.role as TeamRole, territory: m.territory, password: "" }); setShowPw(false); }}>Edit</Button>
        <Button variant="ghost" size="icon" aria-label={`Delete ${m.full_name}`} onClick={() => setRemove(m)}><Trash2/></Button>
      </div>)}{!shown.length && <p className="p-8 text-center text-muted-foreground">{members.length ? "No matching users." : "No team users yet — add your first MR or manager."}</p>}</div>
    </section>

    <Dialog open={Boolean(form)} onOpenChange={(v) => { if (!v && !busy) setForm(null); }}><DialogContent><DialogHeader><DialogTitle>{form?.id ? "Edit user" : "Add team user"}</DialogTitle></DialogHeader>{form && <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); saveUser(); }}>
      <Label htmlFor="tu-name">Full name</Label><Input id="tu-name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}/>
      <Label htmlFor="tu-login">User ID</Label><Input id="tu-login" placeholder="e.g. BR-MR-01" autoComplete="off" value={form.login_id} onChange={(e) => setForm({ ...form, login_id: e.target.value })}/>
      <Label htmlFor="tu-email">Email {form.login_id.trim() ? "(optional)" : ""}</Label><Input id="tu-email" type="email" required={!form.login_id.trim()} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}/>
      <p className="text-xs text-muted-foreground">They can sign in with the User ID or the email. Without an email, password resets are done here by you.</p>
      <Label htmlFor="tu-role">Role</Label><select id="tu-role" className={selectClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as TeamRole })}>{TEAM_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select>
      <Label htmlFor="tu-territory">Division / Territory (optional)</Label><Input id="tu-territory" value={form.territory} onChange={(e) => setForm({ ...form, territory: e.target.value })}/>
      <Label htmlFor="tu-pw">{form.id ? "New password (leave blank to keep)" : "Password"}</Label>
      <div className="flex gap-2"><div className="relative flex-1"><Input id="tu-pw" type={showPw ? "text" : "password"} value={form.password} placeholder={form.id ? "Unchanged" : pw ? "Uses default password" : "At least 8 characters"} onChange={(e) => setForm({ ...form, password: e.target.value })}/><button type="button" className="absolute right-2 top-2.5 text-muted-foreground" aria-label={showPw ? "Hide password" : "Show password"} onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff className="size-4"/> : <Eye className="size-4"/>}</button></div><Button type="button" variant="outline" disabled={!pw} onClick={() => { setForm({ ...form, password: pw }); setShowPw(true); }}>Reset to default</Button></div>
      <Button type="submit" disabled={busy}>{busy ? <Loader2 className="animate-spin"/> : <Save/>}{form.id ? "Save changes" : "Create user"}</Button>
    </form>}</DialogContent></Dialog>

    <Dialog open={quick !== null} onOpenChange={(v) => { if (!v && !busy) setQuick(null); }}><DialogContent><DialogHeader><DialogTitle>Bulk / Quick add</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">One user per line: <code>Name, email, role, territory</code>. Role is mr, manager or admin (defaults to mr). Everyone gets the default password.</p>
      <Textarea rows={8} aria-label="Users to add" value={quick ?? ""} onChange={(e) => setQuick(e.target.value)} placeholder={"Ravi Kumar, ravi@biorica.in, mr, Hyderabad\nAsha Rao, asha@biorica.in, manager, Bangalore"}/>
      <Button disabled={busy || !quick?.trim() || !pw} onClick={quickAdd}>{busy ? <Loader2 className="animate-spin"/> : <UserPlus/>}Create users</Button>{!pw && <p className="text-xs text-destructive">Save a default password first.</p>}
    </DialogContent></Dialog>

    <Dialog open={Boolean(remove)} onOpenChange={(v) => { if (!v && !busy) setRemove(null); }}><DialogContent><DialogHeader><DialogTitle>Delete {remove?.full_name}?</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">Their login is removed and they can no longer sign in. This cannot be undone.</p><Button variant="destructive" disabled={busy} onClick={() => remove && run(async () => { await del({ data: { id: remove.id } }); setRemove(null); toast.success("User deleted"); })}><Trash2/>Delete user</Button></DialogContent></Dialog>
  </div>;
}
