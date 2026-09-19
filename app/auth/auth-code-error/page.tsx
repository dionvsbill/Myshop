"use client";
import Link from "next/link";
import {AlertCircle} from "lucide-react";
import styles from "../../../components/auth.module.css";
export default function AuthCodeError(){return <main className={styles.page}><div className={styles.shell}><section className={styles.formSide}><AlertCircle size={34}/><h1 className={styles.heading}>Authentication link expired</h1><p className={styles.sub}>This authentication link is invalid or has expired. Please request a new link and try again.</p><Link className={styles.submit} href="/login">Back to sign in</Link></section></div></main>}