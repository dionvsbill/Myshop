import { FolderTree } from "lucide-react";
import { createClient } from "../../../../lib/supabase/server";

export default async function Categories() {
  const s = await createClient();
  const { data } = await s.from("categories").select("*").order("name");

  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Catalogue</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight">Collections</h1>
      <p className="mt-2 text-sm text-neutral-500">Organise products into easy-to-browse groups.</p>
      <div className="mt-7 overflow-hidden rounded-xl border bg-white">
        {(data || []).map((c) => (
          <div key={c.id} className="flex items-center gap-4 border-b p-5 last:border-0">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-neutral-100"><FolderTree size={19} className="text-neutral-500"/></div>
            <div><p className="font-semibold">{c.name}</p><p className="mt-1 text-xs text-neutral-500">/{c.slug}</p></div>
          </div>
        ))}
        {!data?.length && <div className="p-10 text-center text-sm text-neutral-500">No collections yet.</div>}
      </div>
    </section>
  );
}
