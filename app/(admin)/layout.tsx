import { redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3, ClipboardList, FolderTree, LayoutDashboard, Package, Settings, Users, Store, Tag, MessageSquare } from "lucide-react";
import { createClient } from "../../lib/supabase/server";

const links = [
  ["/admin","Dashboard",LayoutDashboard],
  ["/admin/products","Products",Package],
  ["/admin/categories","Categories",FolderTree],
  ["/admin/orders","Orders",ClipboardList],
  ["/admin/users","Customers",Users],
  ["/admin/analytics","Insights",BarChart3],
  ["/admin/settings","Settings",Settings],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await createClient();
  const { data: u } = await s.auth.getUser();
  if (!u.user) redirect("/login");
  const { data: p } = await s.from("profiles").select("full_name,email,role").eq("id",u.user.id).single();
  if (!["ADMIN","SHOP_OWNER"].includes(p?.role || "")) redirect("/");

  return <div className="min-h-screen bg-[#f4f5f7] md:pl-[250px]">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[250px] border-r border-[#e7e7e7] bg-white md:flex md:flex-col">
      <div className="border-b px-5 py-5"><Link href="/" className="text-2xl font-black text-[#f68b1e]">MYSHOP</Link><p className="mt-1 text-[11px] font-semibold text-neutral-400">{p?.role === "ADMIN" ? "Administrator" : "Shop owner"}</p></div>
      <nav className="flex-1 space-y-1 p-3">{links.map(([href,label,Icon])=><Link key={href} href={href} className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold text-neutral-600 hover:bg-orange-50 hover:text-[#f68b1e]"><Icon size={18}/>{label}</Link>)}</nav>
      <div className="border-t p-4"><div className="flex items-center gap-3 rounded-lg bg-neutral-50 p-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#f68b1e] text-xs font-bold text-white">{(p?.full_name||p?.email||"A").slice(0,1).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-bold">{p?.full_name||"Administrator"}</p><p className="truncate text-xs text-neutral-500">{p?.email}</p></div></div></div>
    </aside>
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm sm:px-6">
      <div><p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">MYSHOP</p><p className="font-bold">Store management</p></div>
      <Link href="/" className="rounded-md border px-4 py-2 text-sm font-bold hover:bg-neutral-50">View store</Link>
    </header>
    <main className="mx-auto max-w-[1500px] p-4 pb-24 sm:p-6 lg:p-8">{children}</main>
    <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 border-t bg-white shadow-[0_-5px_20px_rgba(0,0,0,.08)] md:hidden">{links.slice(0,5).map(([href,label,Icon])=><Link key={href} href={href} className="flex flex-col items-center gap-1 py-3 text-[10px] font-bold text-neutral-500"><Icon size={18}/>{label}</Link>)}</nav>
  </div>;
}