"use client";
import Link from "next/link";
import {useState} from "react";
import {createClient} from "../../../lib/supabase/client";
import styles from "../../../components/auth.module.css";
export default function ForgotPassword(){
 const [email,setEmail]=useState(""),[message,setMessage]=useState(""),[error,setError]=useState("");
 async function submit(e:React.FormEvent){e.preventDefault();setMessage("");setError("");const {error}=await createClient().auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+"/auth/callback?next=/reset-password"});if(error)setError(error.message);else setMessage("If an account exists for that email, a password reset link has been sent.");}
 return <main className={styles.page}><div className={styles.shell}><section className={styles.formSide}><h1 className={styles.heading}>Forgot password?</h1><p className={styles.sub}>Enter your email and we will send you a secure password reset link.</p><form onSubmit={submit} className={styles.form}><label className={styles.label}>Email<input className={styles.input} required type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>{error&&<p className={styles.error}>{error}</p>}{message&&<p className={styles.sub}>{message}</p>}<button className={styles.submit}>Send reset link</button><p className={styles.foot}><Link href="/login">Back to sign in</Link></p></form></section></div></main>;
}