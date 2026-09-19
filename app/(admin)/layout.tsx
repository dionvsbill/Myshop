import { redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3, ClipboardList, FolderTree, LayoutDashboard, Package, Settings, ShoppingBag, Users } from "lucide-react";
import { createClient } from "../../lib/supabase/server";

const links = [
  ["/admin", "Home", LayoutDashboard],
  ["/admin/products", "Products", Package],
  ["/admin/categories", "Collections", FolderTree],
  ["/admin/orders", "Orders", ClipboardList],
  ["/admin/users", "Customers", Users],
  ["/admin/analytics", "Analytics", BarChart3],
  ["/admin/settings", "Settings", Settings],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await createClient();
  const { data: u } = await s.auth.getUser();
  if (!u.user) redirect("/login");

  const { data: p } = await s.from("profiles").select("full_name,email,role").eq("id", u.user.id).single();
  if (p?.role !== "ADMIN") redirect("/");

  return (
    <div className="min-h-screen bg-[#f6f6f7] md:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-white md:flex md:flex-col">
        <div className="flex h-16 items-center border-b px-5">
          <Link href="/" className="text-xl font-black tracking-tight">Myshop</Link>
          <span className="ml-2 rounded-md bg-neutral-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500">Admin</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {links.map(([href, label, Icon]) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950">
              <Icon size={18} />{label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-4">
          <Link href="/" className="flex items-center gap-3 rounded-lg p-2 hover:bg-neutral-100">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-neutral-950 text-xs font-bold text-white">{(p?.full_name || p?.email || "A").slice(0,1).toUpperCase()}</div>
            <div className="min-w-0"><p className="truncate text-sm font-semibold">{p?.full_name || "Administrator"}</p><p className="truncate text-xs text-neutral-500">{p?.email}</p></div>
          </Link>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/95 px-4 backdrop-blur md:px-8">
        <div className="flex items-center gap-3"><ShoppingBag size={20}/><span className="font-semibold">Store administration</span></div>
        <Link href="/" className="text-sm font-medium text-neutral-500 hover:text-neutral-950">View store →</Link>
      </header>

      <main className="mx-auto max-w-[1440px] p-4 pb-24 sm:p-6 md:p-8">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t bg-white md:hidden">
        {links.slice(0,5).map(([href,label,Icon]) => <Link key={href} href={href} className="flex flex-col items-center gap-1 py-3 text-[10px] font-medium text-neutral-600"><Icon size={18}/>{label}</Link>)}
      </nav>
    </div>
  );
}
