import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { MIN_PASSWORD, type TeamRole } from "./team";

type Ctx = { supabase: any; userId: string };
async function admin(context: Ctx) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Only admins can manage team users.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}
async function syncAdminRole(db: any, userId: string, role: TeamRole) {
  if (role === "admin") await db.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
  else await db.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
}
type NewUser = { full_name: string; email: string; role: TeamRole; territory: string; password: string };
const checkPw = (p: string) => { if (p.length < MIN_PASSWORD) throw new Error(`Password must be at least ${MIN_PASSWORD} characters.`); };

export const createTeamUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { users: NewUser[] }) => d)
  .handler(async ({ data, context }) => {
    const db = await admin(context as Ctx);
    const results: { email: string; ok: boolean; error?: string }[] = [];
    for (const u of data.users) {
      try {
        checkPw(u.password);
        const email = u.email.trim().toLowerCase();
        const { data: created, error } = await db.auth.admin.createUser({ email, password: u.password, email_confirm: true, user_metadata: { full_name: u.full_name } });
        if (error || !created.user) throw new Error(error?.message ?? "Could not create user");
        const { error: e2 } = await db.from("team_members").insert({ user_id: created.user.id, full_name: u.full_name.trim(), email, role: u.role, territory: u.territory.trim() });
        if (e2) { await db.auth.admin.deleteUser(created.user.id); throw new Error(e2.message); }
        await syncAdminRole(db, created.user.id, u.role);
        results.push({ email, ok: true });
      } catch (e) { results.push({ email: u.email, ok: false, error: e instanceof Error ? e.message : "Failed" }); }
    }
    return results;
  });

export const updateTeamUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; full_name?: string; email?: string; role?: TeamRole; territory?: string; is_active?: boolean; password?: string }) => d)
  .handler(async ({ data, context }) => {
    const db = await admin(context as Ctx);
    const { data: m, error } = await db.from("team_members").select("user_id").eq("id", data.id).single();
    if (error || !m) throw new Error("User not found");
    if (m.user_id === (context as Ctx).userId && data.is_active === false) throw new Error("You can't deactivate your own account.");
    const authUpdate: Record<string, any> = {};
    if (data.password) { checkPw(data.password); authUpdate["password"] = data.password; }
    if (data.email) { authUpdate["email"] = data.email.trim().toLowerCase(); authUpdate["email_confirm"] = true; }
    if (data.is_active !== undefined) authUpdate["ban_duration"] = data.is_active ? "none" : "876000h";
    if (Object.keys(authUpdate).length) { const { error: ae } = await db.auth.admin.updateUserById(m.user_id, authUpdate); if (ae) throw new Error(ae.message); }
    const row: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const k of ["full_name", "role", "territory", "is_active"] as const) if (data[k] !== undefined) row[k] = data[k];
    if (data.email) row["email"] = data.email.trim().toLowerCase();
    const { error: ue } = await db.from("team_members").update(row as never).eq("id", data.id); if (ue) throw new Error(ue.message);
    if (data.role) await syncAdminRole(db, m.user_id, data.role);
    return { ok: true };
  });

export const deleteTeamUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const db = await admin(context as Ctx);
    const { data: m } = await db.from("team_members").select("user_id").eq("id", data.id).single();
    if (!m) throw new Error("User not found");
    if (m.user_id === (context as Ctx).userId) throw new Error("You can't delete your own account.");
    const { error } = await db.auth.admin.deleteUser(m.user_id); if (error) throw new Error(error.message);
    await db.from("team_members").delete().eq("id", data.id);
    return { ok: true };
  });
