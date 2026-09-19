"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {createClient} from "../../../lib/supabase/client";
import styles from "../../../components/auth.module.css";
export default function ResetPassword(){
 const [password,setPassword]=useState(""),[confirm,setConfirm]=useState(""),[ready,setReady]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
 useEffect(()=>{createClient().auth.getSession().then(({data})=>{if(data.session)setReady(true);else setError("This reset link is invalid or has expired. Please request a new one.")})},[]);
 async function submit(e:React.FormEvent){e.preventDefault();setError("");setMessage("");if(password.length<8)return setError("Password must be at least 8 characters.");if(password!==confirm)return setError("Passwords do not match.");const {error}=await createClient().auth.updateUser({password});if(error)setError(error.message);else setMessage("Your password has been updated. You can now sign in.");}
 return <main className={styles.page}><div className={styles.shell}><section className={styles.formSide}><h1 className={styles.heading}>Set a new password</h1><p className={styles.sub}>Choose a new password for your Myshop account.</p>{ready?<form onSubmit={submit} className={styles.form}><label className={styles.label}>New password<input className={styles.input} required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label><label className={styles.label}>Confirm password<input className={styles.input} required minLength={8} type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>{error&&<p className={styles.error}>{error}</p>}{message&&<p className={styles.sub}>{message} <Link href="/login">Sign in</Link></p>}<button className={styles.submit}>Update password</button></form>:<p className={styles.error}>{error||"Checking your reset link..."}</p>}</section></div></main>;
}