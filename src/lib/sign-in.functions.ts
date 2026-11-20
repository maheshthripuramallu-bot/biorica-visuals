import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

/** Resolves a User ID or email to the account and signs in, returning session tokens only on success. */
export const signInWithUserId = createServerFn({ method: "POST" })
  .inputValidator((d: { identifier: string; password: string }) => ({ identifier: String(d.identifier ?? "").trim().slice(0, 200), password: String(d.password ?? "").slice(0, 200) }))
  .handler(async ({ data }) => {
    const fail = { ok: false as const, error: "Incorrect User ID or password. Please try again." };
    if (!data.identifier || !data.password) return fail;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let email = data.identifier.toLowerCase();
    const { data: m } = await supabaseAdmin.from("team_members").select("user_id, is_active")
      .or(`login_id.ilike.${data.identifier.replace(/[,()%*\\]/g, "")},email.eq.${email.replace(/[,()]/g, "")}`).limit(1).maybeSingle();
    if (m) {
      if (!m.is_active) return { ok: false as const, error: "This account is inactive. Please contact your Biorica administrator." };
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(m.user_id);
      if (u.user?.email) email = u.user.email;
    } else if (!email.includes("@")) return fail;
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const client = createClient(process.env["SUPABASE_URL"]!, key, { auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => { const h = new Headers(init?.headers); if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization"); h.set("apikey", key); return fetch(input, { ...init, headers: h }); } } });
    const { data: s, error } = await client.auth.signInWithPassword({ email, password: data.password });
    if (error || !s.session) {
      if (error && /banned/i.test(error.message)) return { ok: false as const, error: "This account is inactive. Please contact your Biorica administrator." };
      return fail;
    }
    return { ok: true as const, access_token: s.session.access_token, refresh_token: s.session.refresh_token };
  });
