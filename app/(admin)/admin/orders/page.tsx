import {ClipboardList,Clock3,CheckCircle2,Truck, XCircle} from "lucide-react";
import {createClient} from "../../../../lib/supabase/server";
import styles from "../../../admin/admin.module.css";

function statusStyle(status:string){if(status==="CANCELLED")return styles.orderCancelled;if(["DELIVERED","COMPLETED"].includes(status))return styles.orderDone;if(["PAID","PROCESSING","CONFIRMED","SHIPPED"].includes(status))return styles.orderActive;return styles.orderPending}
function statusIcon(status:string){if(status==="CANCELLED")return XCircle;if(["DELIVERED","COMPLETED"].includes(status))return CheckCircle2;if(["PAID","PROCESSING","CONFIRMED","SHIPPED"].includes(status))return Truck;return Clock3}

export default async function Orders(){
 const s=await createClient();
 const {data,error}=await s.from("orders").select("id,order_number,total,status,created_at,profiles(email,full_name)").order("created_at",{ascending:false});
 if(error)throw new Error("Failed to load orders: "+error.message);
 const orders=data||[];
 return <section className={styles.adminPage}>
  <div className={styles.pageIntro}><div><p className={styles.kicker}>Sales</p><h2>Orders</h2><p>Track customer purchases and fulfilment progress.</p></div><div className={styles.pageStat}><ClipboardList size={17}/><span><b>{orders.length}</b> orders</span></div></div>
  <div className={styles.orderStats}><div><span>Total orders</span><b>{orders.length}</b></div><div><span>In progress</span><b>{orders.filter(o=>["PAID","PROCESSING","CONFIRMED","SHIPPED"].includes(o.status)).length}</b></div><div><span>Completed</span><b>{orders.filter(o=>["DELIVERED","COMPLETED"].includes(o.status)).length}</b></div><div><span>Cancelled</span><b>{orders.filter(o=>o.status==="CANCELLED").length}</b></div></div>
  <div className={styles.orderPanel}><div className={styles.orderPanelHead}><div><b>Recent orders</b><small>Newest orders appear first</small></div><span>GHS totals</span></div>
   <div className={styles.orderTableHead}><span>Order</span><span>Customer</span><span>Total</span><span>Status</span><span>Date</span></div>
   {orders.length?orders.map((o:any)=>{const profile=Array.isArray(o.profiles)?o.profiles[0]:o.profiles;const Icon=statusIcon(o.status);return <div className={styles.orderRow} key={o.id}>
    <div className={styles.orderNumber}><div><ClipboardList size={15}/></div><b>{o.order_number}</b></div>
    <div className={styles.orderCustomer}><b>{profile?.full_name||"Customer"}</b><small>{profile?.email||"No email"}</small></div>
    <b className={styles.orderTotal}>GHS {Number(o.total).toFixed(2)}</b>
    <span className={statusStyle(o.status)}><Icon size={12}/>{o.status}</span>
    <time>{new Date(o.created_at).toLocaleDateString("en-GH",{day:"2-digit",month:"short",year:"numeric"})}</time>
   </div>}) : <div className={styles.emptyPanel}><ClipboardList size={28}/><b>No orders yet</b><span>Customer orders will appear here.</span></div>}
  </div>
 </section>
}