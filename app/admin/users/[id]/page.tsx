import Link from "next/link";
import {redirect} from "next/navigation";
import {ArrowLeft,CheckCircle2,MapPin,ShieldCheck,ShoppingBag,UserRound} from "lucide-react";
import {createClient} from "../../../../lib/supabase/server";

export default async function AdminUser({params}:{params:{id:string}}){
 const s=await createClient();
 const {data:{user:me}}=await s.auth.getUser();
 if(!me)redirect("/login");
 const {data:admin}=await s.from("profiles").select("role").eq("id",me.id).single();
 if(admin?.role!=="ADMIN")redirect("/account");
 const [{data:user},{data:orders}]=await Promise.all([
  s.from("profiles").select("id,email,full_name,username,avatar_url,phone,location,about,website,role,created_at,is_deactivated").eq("id",params.id).single(),
  s.from("orders").select("id,order_number,total,status,payment_reference,paid_at,created_at,shipping_address,items").eq("user_id",params.id).order("created_at",{ascending:false})
 ]);
 if(!user)redirect("/admin");
 const paid=(orders||[]).filter(o=>o.payment_reference&&o.paid_at);
 const spent=paid.reduce((n,o)=>n+Number(o.total||0),0);
 return <section style={{maxWidth:1100,margin:"0 auto",padding:"8px 0 50px"}}>
  <Link href="/admin" style={{display:"inline-flex",alignItems:"center",gap:7,fontWeight:700,fontSize:14}}><ArrowLeft size={16}/>Back to admin</Link>
  <div style={{marginTop:20,display:"grid",gap:18,gridTemplateColumns:"minmax(0,1fr) 300px"}}>
   <div style={{border:"1px solid #e5e5e5",borderRadius:18,padding:24,background:"#fff"}}>
    <div style={{display:"flex",gap:16,alignItems:"center"}}><img src={user.avatar_url||"https://api.dicebear.com/9.x/initials/svg?seed="+encodeURIComponent(user.email||"user")} alt="" style={{width:68,height:68,borderRadius:"50%",objectFit:"cover"}}/><div><p style={{fontSize:12,fontWeight:800,letterSpacing:".15em",color:"#737373"}}>CUSTOMER ACCOUNT</p><h1 style={{fontSize:28,fontWeight:900,marginTop:4}}>{user.full_name||"Unnamed customer"}</h1><p style={{color:"#737373"}}>{user.email}</p></div></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12,marginTop:24}}>{[["Username",user.username?("@"+user.username):"Not provided"],["Phone",user.phone||"Not provided"],["Location",user.location||"Not provided"],["Role",user.role||"CUSTOMER"],["Joined",new Date(user.created_at).toLocaleString()],["Status",user.is_deactivated?"Deactivated":"Active"]].map(([a,b])=><div key={a} style={{border:"1px solid #eee",borderRadius:12,padding:14}}><small style={{display:"block",color:"#737373"}}>{a}</small><b style={{display:"block",marginTop:5}}>{b}</b></div>)}</div>
    {user.about&&<div style={{marginTop:16}}><small style={{color:"#737373"}}>About</small><p style={{marginTop:5,lineHeight:1.6}}>{user.about}</p></div>}
   </div>
   <div style={{display:"grid",gap:12,alignContent:"start"}}>
    <Metric icon={ShoppingBag} title="Orders" value={String(orders?.length||0)}/>
    <Metric icon={CheckCircle2} title="Verified purchases" value={String(paid.length)}/>
    <Metric icon={ShieldCheck} title="Verified spend" value={"GHS "+spent.toFixed(2)}/>
   </div>
  </div>
  <div style={{marginTop:18,border:"1px solid #e5e5e5",borderRadius:18,padding:24,background:"#fff"}}>
   <h2 style={{fontSize:20,fontWeight:900}}>Order history</h2>
   <div style={{marginTop:16,display:"grid",gap:10}}>{(orders||[]).map(o=><div key={o.id} style={{border:"1px solid #eee",borderRadius:12,padding:15,display:"grid",gridTemplateColumns:"1fr auto auto",gap:16,alignItems:"center"}}><div><b>{o.order_number||o.id.slice(0,8)}</b><small style={{display:"block",color:"#737373",marginTop:3}}>{new Date(o.created_at).toLocaleString()}</small></div><span style={{fontWeight:800}}>{o.status}</span><div style={{textAlign:"right"}}><b>GHS {Number(o.total||0).toFixed(2)}</b><small style={{display:"block",color:o.payment_reference&&o.paid_at?"#15803d":"#b45309"}}>{o.payment_reference&&o.paid_at?"Payment verified":"Payment not verified"}</small></div></div>)}</div>
  </div>
 </section>
}
function Metric({icon:I,title,value}:any){return <div style={{border:"1px solid #e5e5e5",borderRadius:15,padding:18,background:"#fff"}}><I size={19}/><small style={{display:"block",marginTop:12,color:"#737373"}}>{title}</small><strong style={{display:"block",fontSize:24,marginTop:5}}>{value}</strong></div>}
