import Link from "next/link";
import { Star, ShoppingCart } from "lucide-react";
import styles from "./productCard.module.css";

export type ProductCardItem={id:string;slug:string;title:string;price:number;compare_price?:number|null;images?:string[];rating?:number|null;review_count?:number|null;stock?:number|null};

export default function ProductCard({product}:{product:ProductCardItem}){
 const p=product; const discount=p.compare_price&&Number(p.compare_price)>Number(p.price)?Math.round((1-Number(p.price)/Number(p.compare_price))*100):0; const left=Math.min(Number(p.stock||0),9);
 return <article className={styles.card}>
  <Link href={"/product/"+p.slug} className={styles.imageLink}>
   <div className={styles.imageWrap}><img src={p.images?.[0]||""} alt={p.title} loading="lazy"/>{discount>0&&<span className={styles.badge}>-{discount}%</span>}</div>
  </Link>
  <div className={styles.content}>
   <Link href={"/product/"+p.slug} className={styles.title}>{p.title}</Link>
   <div className={styles.price}>GHS {Number(p.price).toFixed(2)}</div>
   {discount>0&&<div className={styles.oldPrice}>GHS {Number(p.compare_price).toFixed(2)}</div>}
   <div className={styles.meta}><span className={styles.rating}><Star size={12} fill="currentColor"/>{Number(p.rating||0).toFixed(1)}</span><span>({p.review_count||0})</span></div>
   {left>0&&<><div className={styles.stockBar}><span style={{width:(100-left*10)+"%"}}/></div><div className={styles.stock}>Only {left} left</div></>}
   <Link href={"/product/"+p.slug} className={styles.cart}><ShoppingCart size={14}/> View product</Link>
  </div>
 </article>
}