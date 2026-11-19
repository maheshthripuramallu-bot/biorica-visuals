import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const authQuery = queryOptions({
  queryKey: ["auth"],
  queryFn: async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return { user: null, isAdmin: false };
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    return { user, isAdmin: Boolean(isAdmin) };
  },
  staleTime: 30_000,
});

export function useAuth() {
  return useQuery({ ...authQuery, enabled: typeof window !== "undefined" });
}
