import { redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3, ClipboardList, FolderTree, LayoutDashboard, Package, Settings, Users, ShoppingCart } from "lucide-react";
import { createClient } from "../../lib/supabase/server";
import styles from "../../components/sidebar.module.css";

const links=,"Products",Package],["/admin/categories","Categories",FolderTree],["/admin/orders","Orders",ClipboardList],["/admin/users","Customers",Users],["/admin/analytics","Insights",BarChart3],["/admin/settings","Settings",Settings]] as const;

export default async function AdminLayout({children}:{children:React.ReactNode}){
 const s=await createClient();const {data:u}=await s.auth.getUser();if(!u.user)redirect("/login");
 const {data:p}=await s.from("profiles").select("full_name,email,role").eq("id",u.user.id).single();if(!["ADMIN","SHOP_OWNER"].includes(p?.role||""))redirect("/");
 return <div className="adminShell"><aside className={styles.sidebar}><div className={styles.sidebarTop}><Link href="/" className={styles.brand}>MYSHOP</Link><p className={styles.role}>{p?.role==="ADMIN"?"Administrator":"Shop owner"}</p></div><nav className={styles.sidebarMenu}>{links.map(([href,label,Icon])=><Link key={href} href={href} className={styles.menuItem}><Icon size={18}/>{label}</Link>)}</nav><div className={styles.sidebarBottom}><div className={styles.profile}><div className={styles.avatar}>{(p?.full_name||p?.email||"A").slice(0,1).toUpperCase()}</div><div><p className={styles.name}>{p?.full_name||"Administrator"}</p><p className={styles.email}>{p?.email}</p></div></div></div></aside><div className="adminMain"><header className="adminTopbar"><div><p className="eyebrow">MYSHOP</p><p><strong>Store management</strong></p></div><Link href="/" className="btnSecondary">View store</Link></header><main className="adminContent">{children}</main></div><nav className="bottomNavFallback">{links.slice(0,5).map(([href,label,Icon])=><Link key={href} href={href}><Icon size={18}/><span>{label}</span></Link>)}</nav></div>
}