"use client";
import Link from "next/link";
import {Heart, ShoppingCart, Star} from "lucide-react";
import {useState} from "react";
import {createClient} from "../lib/supabase/client";
import styles from "./productCard.module.css";

export type ProductCardItem={id:string;slug:string;title:string;price:number;compare_price?:number|null;images?:string[];rating?:number|null;review_count?:number|null;stock?:number|null};

export default function ProductCard({product}:{product:ProductCardItem}){
 const p=product; const [busy,setBusy]=useState<"cart"|"wish"|null>(null); const [message,setMessage]=useState("");
 const discount=p.compare_price&&Number(p.compare_price)>Number(p.price)?Math.round((1-Number(p.price)/Number(p.compare_price))*100):0; const left=Math.min(Number(p.stock||0),9);
 const action=async(type:"cart"|"wish")=>{setBusy(type);setMessage("");const s=createClient();const {data:{user}}=await s.auth.getUser();if(!user){location.href="/login";return}
  if(type==="cart"){const {data:existing}=await s.from("cart_items").select("id,quantity").eq("user_id",user.id).eq("product_id",p.id).maybeSingle();const result=existing?await s.from("cart_items").update({quantity:Number(existing.quantity||1)+1}).eq("id",existing.id):await s.from("cart_items").insert({user_id:user.id,product_id:p.id,quantity:1});setMessage(result.error?"Unable to add":"Added to cart");}
  else {const result=await s.from("wishlists").upsert({user_id:user.id,product_id:p.id},{onConflict:"user_id,product_id"});setMessage(result.error?"Unable to save":"Saved");}
  setBusy(null);
 };
 return <article className={styles.card}>
  <Link href={"/product/"+p.slug} className={styles.imageLink}>
   <div className={styles.imageWrap}><img src={p.images?.[0]||""} alt={p.title} loading="lazy"/>{p.images?.[1]&&<img src={p.images[1]} alt="" loading="lazy" className={styles.altImage}/>}{discount>0&&<span className={styles.badge}>-{discount}%</span>}</div>
  </Link>
  <div className={styles.content}>
   <Link href={"/product/"+p.slug} className={styles.title}>{p.title}</Link>
   <div className={styles.price}>GHS {Number(p.price).toFixed(2)}</div>
   {discount>0&&<div className={styles.oldPrice}>GHS {Number(p.compare_price).toFixed(2)}</div>}
   <div className={styles.meta}><span className={styles.rating}><Star size={12} fill="currentColor"/>{Number(p.rating||0).toFixed(1)}</span><span>({p.review_count||0})</span></div>
   {left>0&&<><div className={styles.stockBar}><span style={{width:(100-left*10)+"%"}}/></div><div className={styles.stock}>Only {left} left</div></>}
   <div className={styles.actions}>
    <button type="button" className={styles.iconAction} onClick={()=>action("cart")} disabled={!!busy||left===0} aria-label="Add to cart" title="Add to cart"><ShoppingCart size={15}/></button>
    <button type="button" className={styles.iconAction} onClick={()=>action("wish")} disabled={!!busy} aria-label="Add to wishlist" title="Add to wishlist"><Heart size={15}/></button>
    {message&&<span className={styles.actionMessage}>{message}</span>}
   </div>
  </div>
 </article>
}