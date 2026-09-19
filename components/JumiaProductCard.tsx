import {Star,ExternalLink} from "lucide-react";
import styles from "./productCard.module.css";

export type JumiaCardItem={id:string;title:string;price:number|null;compare_price?:number|null;images?:string[];rating?:number|null;review_count?:number;source_url:string;jforce_url?:string|null};

export default function JumiaProductCard({product}:{product:JumiaCardItem}){
 const discount=product.compare_price&&Number(product.compare_price)>Number(product.price||0)?Math.round((1-Number(product.price||0)/Number(product.compare_price))*100):0;
 return <article className={styles.card}>
  <a href={product.source_url} target="_blank" rel="noreferrer" className={styles.imageLink}>
   <div className={styles.imageWrap}><img src={product.images?.[0]||""} alt={product.title} loading="lazy"/>{discount>0&&<span className={styles.badge}>-{discount}%</span>}</div>
  </a>
  <div className={styles.content}>
   <a href={product.source_url} target="_blank" rel="noreferrer" className={styles.title}>{product.title}</a>
   <div className={styles.price}>{product.price!=null?"GHS "+Number(product.price).toFixed(2):"Price on Jumia"}</div>
   {product.rating!=null&&<div className={styles.meta}><span className={styles.rating}><Star size={12} fill="currentColor"/>{Number(product.rating).toFixed(1)}</span><span>({product.review_count||0})</span></div>}
   <a href={product.jforce_url||"https://jforce.jumia.com.gh/s/iHaN1Ck"} target="_blank" rel="noreferrer" className={styles.actions}><span>Shop through JForce</span><ExternalLink size={15}/></a>
  </div>
 </article>
}