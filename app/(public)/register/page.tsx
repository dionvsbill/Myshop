"use client";
import Link from "next/link";
import {useState} from "react";
import {ShieldCheck,ShoppingBag,Truck,Loader2,MailCheck,AlertCircle} from "lucide-react";
import {createClient} from "../../../lib/supabase/client";
import styles from "../../../components/auth.module.css";

export default function Register(){
 const[f,setF]=useState({email:"",password:"",full_name:""});
 const[error,setError]=useState(""); const[message,setMessage]=useState(""); const[loading,setLoading]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();if(loading)return;setError("");setMessage("");setLoading(true);
  try{const s=createClient();const{data,error}=await s.auth.signUp({email:f.email.trim(),password:f.password,options:{data:{full_name:f.full_name.trim()},emailRedirectTo:location.origin+"/auth/callback?next=/" }});
   if(error){setError(error.message);return}
   if(!data.session){setMessage("Account created. Check your email to confirm your account, then sign in.");return}
   location.href="/";
  }catch(err){setError(err instanceof Error?err.message:"We couldn't create your account. Please try again.");}
  finally{setLoading(false)}
 }
 return <main className={styles.page}><div className={styles.shell}><section className={styles.visual}><div className={styles.brand}>MY<span className={styles.accent}>SHOP</span></div><h2>Start your shopping journey.</h2><p>Create one account to manage your profile, cart and orders across your devices.</p><div className={styles.benefits}><div className={styles.benefit}><ShoppingBag size={15}/> Save your shopping activity</div><div className={styles.benefit}><ShieldCheck size={15}/> Secure account experience</div><div className={styles.benefit}><Truck size={15}/> Manage your orders</div></div></section><section className={styles.formSide}><div className={styles.formHeader}><span className={styles.kicker}>MYSHOP ACCOUNT</span><h1 className={styles.heading}>Create your account</h1><p className={styles.sub}>Join Myshop and start discovering products.</p></div><form onSubmit={submit} className={styles.form}><label className={styles.label}>Full name<input required className={styles.input} placeholder="Your full name" value={f.full_name} onChange={e=>setF({...f,full_name:e.target.value})}/></label><label className={styles.label}>Email<input required type="email" className={styles.input} placeholder="you@example.com" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></label><label className={styles.label}>Password<input required minLength={8} type="password" className={styles.input} placeholder="At least 8 characters" value={f.password} onChange={e=>setF({...f,password:e.target.value})}/></label>{error&&<div className={styles.error}><AlertCircle size={16}/><span>{error}</span></div>}{message&&<div className={styles.success}><MailCheck size={17}/><span>{message}</span></div>}<button disabled={loading} className={styles.submit}>{loading?<><Loader2 size={17} className={styles.spin}/>Creating account...</>:<>Create account</>}</button><p className={styles.foot}>Already have an account? <Link href="/login">Sign in</Link></p></form></section></div></main>
}