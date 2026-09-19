"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {Activity,BarChart3,Boxes,CheckCircle2,ClipboardList,FolderTree,LayoutDashboard,LogOut,Package,RefreshCw,Search,Settings,ShieldCheck,ShoppingCart,Tag,Users,UserRound,LockKeyhole} from "lucide-react";
import {createClient} from "../../lib/supabase/client";
import styles from "./admin.module.css";

type Product={id:string;title:string;slug?:string;price:number;compare_price?:number|null;base_price?:number|null;discount_percent?:number;stock:number;is_active:boolean;stock_visibility_override?:boolean;images?:string[]};
type Order={id:string;order_number?:string;total:number;status:string;payment_reference?:string|null;paid_at?:string|null;user_id?:string;created_at:string};
type User={id:string;email?:string;full_name?:string;username?:string;role?:string;phone?:string;created_at:string;is_deactivated?:boolean};

const months=Array.from({length:6},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-5+i);return {key:`${d.getFullYear()}-${d.getMonth()}`,label:d.toLocaleString("en-US",{month:"short"})}});

export default function AdminPage(){
 const [profile,setProfile]=useState<any>(null),[tab,setTab]=useState("overview"),[orders,setOrders]=useState<Order[]>([]),[products,setProducts]=useState<Product[]>([]),[users,setUsers]=useState<User[]>([]),[categories,setCategories]=useState<any[]>([]),[q,setQ]=useState(""),[loading,setLoading]=useState(true),[msg,setMsg]=useState("");

 const load=async()=>{
  const s=createClient();const {data:{user}}=await s.auth.getUser();
  if(!user){location.href="/login";return}
  const {data:p}=await s.from("profiles").select("*").eq("id",user.id).single();
  if(p?.role!=="ADMIN"){location.href="/account";return}
  setProfile(p);
  const [o,pr,c,u]=await Promise.all([
   s.from("orders").select("*").order("created_at",{ascending:false}).limit(500),
   s.from("products").select("*").order("created_at",{ascending:false}).limit(500),
   s.from("categories").select("*").order("name"),
   s.from("profiles").select("id,email,full_name,username,role,phone,created_at,is_deactivated").order("created_at",{ascending:false}).limit(500)
  ]);
  setOrders(o.data||[]);setProducts(pr.data||[]);setCategories(c.data||[]);setUsers(u.data||[]);setLoading(false);
 };
 useEffect(()=>{void load()},[]);

 async function updateProduct(id:string,patch:Record<string,unknown>,message:string){
  const s=createClient();const {error}=await s.from("products").update(patch).eq("id",id);
  if(error)setMsg(error.message);else{setProducts(x=>x.map(p=>p.id===id?{...p,...patch}:p));setMsg(message)}
 }
 async function toggleProduct(p:Product){
  const publishing=p.is_active===false;
  await updateProduct(p.id,{is_active:publishing,stock_visibility_override:publishing && Number(p.stock)<=0},"Product "+(publishing?"published":"hidden")+".");
 }
 async function discount(p:Product,percent:number){
  if(!Number.isFinite(percent)||percent<0||percent>=100){setMsg("Discount must be between 0 and 99%.");return}
  const base=Number(p.base_price||p.compare_price||p.price||0);
  if(percent===0){await updateProduct(p.id,{price:base,compare_price:null,base_price:base,discount_percent:0},"Discount removed.");return}
  const sale=Number((base*(1-percent/100)).toFixed(2));
  await updateProduct(p.id,{price:sale,compare_price:base,base_price:base,discount_percent:percent},"Discount applied.");
 }
 async function order(id:string,status:string){
  const o=orders.find(x=>x.id===id);if(!o)return;
  if(status!=="CANCELLED" && status!=="PENDING" && !o.payment_reference){setMsg("Payment is not verified. This order cannot be fulfilled.");return}
  const s=createClient();const {error}=await s.from("orders").update({status}).eq("id",id);
  if(error){setMsg(error.message);return}
  const {error:eventError}=await s.from("order_tracking_events").insert({order_id:id,status,title:status.replaceAll("_"," "),description:"Order status updated by administration."});
  setOrders(x=>x.map(v=>v.id===id?{...v,status}:v));setMsg(eventError?"Order updated, but tracking event could not be written.":"Order updated.");
 }
 async function user(id:string,disabled:boolean){
  const s=createClient();const {error}=await s.from("profiles").update({is_deactivated:disabled}).eq("id",id);
  if(error)setMsg(error.message);else{setUsers(x=>x.map(u=>u.id===id?{...u,is_deactivated:disabled}:u));setMsg(disabled?"Customer deactivated.":"Customer restored.")}
 }

 const paid=orders.filter(o=>Boolean(o.payment_reference&&o.paid_at));
 const revenue=paid.reduce((n,o)=>n+Number(o.total||0),0);
 const filteredProducts=products.filter(x=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase()));
 const filteredUsers=users.filter(x=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase()));
 const filteredOrders=orders.filter(x=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase()));
 const chart=useMemo(()=>months.map(m=>({label:m.label,users:users.filter(u=>{const d=new Date(u.created_at);return `${d.getFullYear()}-${d.getMonth()}`===m.key}).length,orders:orders.filter(o=>{const d=new Date(o.created_at);return `${d.getFullYear()}-${d.getMonth()}`===m.key}).length,revenue:orders.filter(o=>{const d=new Date(o.created_at);return `${d.getFullYear()}-${d.getMonth()}`===m.key&&Boolean(o.payment_reference&&o.paid_at)}).reduce((n,o)=>n+Number(o.total||0),0)})),[users,orders]);
 const maxChart=Math.max(1,...chart.map(x=>Math.max(x.users,x.orders)));

 const menu=[["overview","Overview",LayoutDashboard],["orders","Orders",ClipboardList],["products","Products",Package],["categories","Categories",FolderTree],["users","Customers",Users],["activity","Activity",Activity],["settings","Settings",Settings]];

 return <section className={styles.shell}>
  <aside className={styles.sidebar}>
   <Link href="/" className={styles.logo}><span>M</span>Myshop</Link>
   <div className={styles.admin}><ShieldCheck size={17}/><div><b>Admin control</b><small>{profile?.email}</small></div></div>
   <nav>{menu.map(([k,l,I]:any)=><button className={tab===k?styles.active:""} onClick={()=>{setTab(k);setQ("")}} key={k}><I size={18}/>{l}</button>)}</nav>
   <div className={styles.bottom}><Link href="/">View storefront</Link><button onClick={async()=>{await createClient().auth.signOut();location.href="/"}}><LogOut size={17}/>Log out</button></div>
  </aside>
  <main className={styles.main}>
   <header><div><small>MYSHOP ADMIN</small><h1>{menu.find(x=>x[0]===tab)?.[1]}</h1></div><div className={styles.tools}><div><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search management data"/></div><button onClick={()=>{setLoading(true);void load()}}><RefreshCw size={18}/></button></div></header>
   {msg&&<div className={styles.notice}>{msg}</div>}
   {loading?<div className={styles.loading}><RefreshCw className={styles.spin}/>Loading admin dashboard...</div>:<div className={styles.content}>
    {tab==="overview"&&<><div className={styles.stats}>
      <Card icon={BarChart3} title="Verified sales" value={"GHS "+revenue.toFixed(2)} note={paid.length+" paid orders"}/>
      <Card icon={ShoppingCart} title="Orders" value={orders.length} note={orders.filter(o=>o.status!=="COMPLETED"&&o.status!=="CANCELLED").length+" active"}/>
      <Card icon={Package} title="Products" value={products.length} note={products.filter(p=>Number(p.stock)<=5).length+" low stock"}/>
      <Card icon={Users} title="Customers" value={users.filter(u=>u.role!=="ADMIN").length} note={users.filter(u=>u.is_deactivated).length+" deactivated"}/>
    </div>
    <Panel title="Six-month platform analytics"><div style={{display:"grid",gap:18,gridTemplateColumns:"repeat(3,minmax(0,1fr))"}}>
      {[[ "Users", "users" ],[ "Orders","orders" ],[ "Verified revenue","revenue" ]].map(([label,key])=><div key={key}><div style={{fontWeight:800,marginBottom:12}}>{label}</div><div style={{height:190,display:"flex",alignItems:"end",gap:8}}>{chart.map((m:any)=><div key={m.label} style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"end",height:"100%",textAlign:"center"}}><div style={{fontSize:11,fontWeight:700,marginBottom:5}}>{key==="revenue"?"GHS "+m[key].toFixed(0):m[key]}</div><div style={{height:`${Math.max(8,(key==="revenue"?m[key]/Math.max(1,...chart.map((x:any)=>x.revenue)):m[key]/maxChart)*135)}px`,background:"linear-gradient(180deg,#f97316,#fb923c)",borderRadius:"7px 7px 3px 3px"}}/><small style={{marginTop:7,color:"#737373"}}>{m.label}</small></div>)}</div></div>)}
    </div></Panel>
    <div className={styles.cols}><Panel title="Recent orders"><Rows rows={orders.slice(0,8)}/></Panel><Panel title="Inventory health"><div className={styles.inventory}>{products.slice(0,10).map(p=><div key={p.id}><span>{p.title}</span><b className={Number(p.stock)<=5?styles.low:""}>{p.stock}</b></div>)}</div></Panel></div>
    </>}
    {tab==="orders"&&<Panel title={filteredOrders.length+" orders"}><div className={styles.table}><table><thead><tr><th>Order</th><th>Total</th><th>Payment</th><th>Status</th><th>Control</th></tr></thead><tbody>{filteredOrders.map(o=><tr key={o.id}><td><b>{o.order_number||o.id.slice(0,8)}</b><small>{new Date(o.created_at).toLocaleString()}</small></td><td>GHS {Number(o.total||0).toFixed(2)}</td><td><span style={{fontWeight:700,color:o.payment_reference&&o.paid_at?"#15803d":"#b45309"}}>{o.payment_reference&&o.paid_at?"Verified":"Unverified"}</span><small>{o.payment_reference||"No Paystack reference"}</small></td><td>{o.status}</td><td><select value={o.status||"PENDING"} onChange={e=>void order(o.id,e.target.value)}><option>PENDING</option><option>PROCESSING</option><option>CONFIRMED</option><option>SHIPPED</option><option>DELIVERED</option><option>COMPLETED</option><option>CANCELLED</option></select></td></tr>)}</tbody></table></div></Panel>}
    {tab==="products"&&<Panel title={filteredProducts.length+" products"}><div className={styles.table}><table><thead><tr><th>Product</th><th>Price</th><th>Discount</th><th>Stock</th><th>Status</th><th>Controls</th></tr></thead><tbody>{filteredProducts.map(p=><tr key={p.id}><td><div className={styles.prod}>{p.images?.[0]&&<img src={p.images[0]} alt=""/>}<span><b>{p.title}</b><small>{p.slug||p.id}</small></span></div></td><td>GHS {Number(p.price||0).toFixed(2)}{p.compare_price?<small>Was GHS {Number(p.compare_price).toFixed(2)}</small>:null}</td><td><span style={{fontWeight:800}}>{Number(p.discount_percent||0)>0?Number(p.discount_percent).toFixed(0)+"%":"None"}</span><div style={{display:"flex",gap:5,marginTop:6}}><button onClick={()=>{const raw=window.prompt("Discount percentage (0 removes it)",String(Number(p.discount_percent||0)));if(raw!==null)void discount(p,Number(raw))}}><Tag size={14}/>{Number(p.discount_percent||0)>0?"Edit":"Apply"}</button>{Number(p.discount_percent||0)>0&&<button onClick={()=>void discount(p,0)}>Remove</button>}</div></td><td className={Number(p.stock)<=5?styles.low:""}>{p.stock}</td><td>{p.is_active===false?(Number(p.stock)<=0?"Auto-hidden / hidden":"Hidden"):"Live"}</td><td><button onClick={()=>void toggleProduct(p)}>{p.is_active===false?"Publish":"Hide"}</button>{Number(p.stock)<=0&&p.is_active===false&&<small style={{display:"block",marginTop:5}}>Publishing overrides zero-stock auto-hide until stock changes.</small>}</td></tr>)}</tbody></table></div></Panel>}
    {tab==="categories"&&<Panel title={categories.length+" categories"}><div className={styles.categoryGrid}>{categories.map(c=><div key={c.id}><FolderTree size={18}/><b>{c.name}</b><small>{c.slug}</small></div>)}</div></Panel>}
    {tab==="users"&&<Panel title={filteredUsers.length+" accounts"}><div className={styles.table}><table><thead><tr><th>Customer</th><th>Role</th><th>Joined</th><th>Status</th><th>Controls</th></tr></thead><tbody>{filteredUsers.map(u=><tr key={u.id}><td><div style={{display:"flex",alignItems:"center",gap:10}}><UserRound size={18}/><span><b>{u.full_name||"Unnamed"}</b><small>{u.email}</small></span></div></td><td>{u.role}</td><td>{new Date(u.created_at).toLocaleDateString()}</td><td>{u.is_deactivated?"Deactivated":"Active"}</td><td style={{display:"flex",gap:6,flexWrap:"wrap"}}><Link href={"/admin/users/"+u.id} style={{fontWeight:800}}>View account</Link>{u.role!=="ADMIN"&&<button onClick={()=>void user(u.id,!u.is_deactivated)}>{u.is_deactivated?"Restore":"Deactivate"}</button>}</td></tr>)}</tbody></table></div></Panel>}
    {tab==="activity"&&<Panel title="Recent platform activity"><div className={styles.activity}>{orders.slice(0,25).map(o=><div key={o.id}><Activity size={17}/><span><b>Order {o.order_number||o.id.slice(0,8)}</b><small>{o.status} · {o.payment_reference&&o.paid_at?"Payment verified":"Payment unverified"}</small></span><time>{new Date(o.created_at).toLocaleString()}</time></div>)}</div></Panel>}
    {tab==="settings"&&<Panel title="Administration and payment protection"><div className={styles.settings}>
      <div><ShieldCheck/><span><b>Protected admin access</b><small>Only the ADMIN role can open management controls.</small></span></div>
      <div><LockKeyhole/><span><b>Payment verification gate</b><small>Order fulfilment controls reject paid-state transitions when there is no verified payment reference.</small></span></div>
      <div><Boxes/><span><b>Inventory protection</b><small>Zero-stock products are automatically hidden unless an administrator explicitly overrides visibility.</small></span></div>
      <div><CheckCircle2/><span><b>Live database controls</b><small>Products, stock, discounts, orders, customers and tracking are managed against Supabase with RLS.</small></span></div>
    </div></Panel>}
   </div>}
  </main>
 </section>
}
function Card({icon:I,title,value,note}:any){return <div className={styles.card}><I size={19}/><small>{title}</small><strong>{value}</strong><span>{note}</span></div>}
function Panel({title,children}:any){return <section className={styles.panel}><div className={styles.panelHead}><h2>{title}</h2></div>{children}</section>}
function Rows({rows}:{rows:Order[]}){return <div className={styles.simpleRows}>{rows.map(o=><div key={o.id}><b>{o.order_number||o.id.slice(0,8)}</b><span>{o.status}</span><strong>GHS {Number(o.total||0).toFixed(2)}</strong></div>)}</div>}
