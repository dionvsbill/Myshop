import { Users } from "lucide-react";
import { createClient } from "../../../../lib/supabase/server";

export default async function UsersPage() {
  const s = await createClient();
  const { data } = await s.from("profiles").select("id,email,full_name,role,phone,created_at").order("created_at", { ascending: false });

  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Customers</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight">Customers</h1>
      <p className="mt-2 text-sm text-neutral-500">Accounts registered on your storefront.</p>
      <div className="mt-7 overflow-hidden rounded-xl border bg-white">
        <div className="hidden grid-cols-[1.4fr_1fr_1fr_100px] gap-4 border-b bg-neutral-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500 md:grid"><span>Customer</span><span>Phone</span><span>Joined</span><span>Role</span></div>
        {(data || []).map((u) => (
          <div key={u.id} className="grid gap-3 border-b px-5 py-4 last:border-0 md:grid-cols-[1.4fr_1fr_1fr_100px] md:items-center">
            <div><p className="font-semibold">{u.full_name || "Unnamed customer"}</p><p className="text-xs text-neutral-500">{u.email}</p></div>
            <p className="text-sm text-neutral-600">{u.phone || "—"}</p>
            <p className="text-sm text-neutral-600">{new Date(u.created_at).toLocaleDateString()}</p>
            <span className="w-fit rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold">{u.role}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
