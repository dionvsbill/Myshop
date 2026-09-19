import Link from "next/link";
import {Package,Plus,Search,ArrowUpRight} from "lucide-react";
import {createClient} from "../../../../lib/supabase/server";
import EditProductModal from "../../../../components/EditProductModal";
import styles from "../../../../admin/admin.module.css";

export default async function AdminProducts(){
 const s=await createClient();
 const {data,error}=await s.from("products").select("id,slug,title,price,stock,is_active,images,categories(name)").order("created_at",{ascending:false});
 if(error)throw new Error(error.message);
 const products=data||[];
 return <section className={styles.adminPage}>
  <div className={styles.pageIntro}>
   <div><p className={styles.kicker}>Catalogue management</p><h2>Products</h2><p>Manage pricing, stock and visibility from one place.</p></div>
   <Link href="/admin/products/new" className={styles.primary}><Plus size={16}/> Add product</Link>
  </div>
  <div className={styles.productSummary}><div><Package size={17}/><span><b>{products.length}</b> products</span></div><span>Live {products.filter(p=>p.is_active).length} · Hidden {products.filter(p=>!p.is_active).length}</span><div className={styles.adminSearch}><Search size={15}/><input placeholder="Search products"/></div></div>
  <div className={styles.adminProductGrid}>{products.map((p:any)=>{const cat=Array.isArray(p.categories)?p.categories[0]:p.categories;const image=p.images?.[0];const stock=Number(p.stock||0);return <article key={p.id} className={styles.adminProductCard}>
   <div className={styles.adminProductImage}>{image?<img src={image} alt="" loading="lazy"/>:<Package size={30}/>}<span className={p.is_active?styles.cardLive:styles.cardHidden}>{p.is_active?"LIVE":"HIDDEN"}</span></div>
   <div className={styles.adminProductBody}><div className={styles.adminProductTitle}><div><h3>{p.title}</h3><small>{cat?.name||"Uncategorised"}</small></div><span className={stock<=0?styles.stockOut:stock<5?styles.stockLow:styles.stockGood}>{stock<=0?"OUT":stock+" in stock"}</span></div>
    <div className={styles.adminProductPrice}>GHS {Number(p.price).toFixed(2)}</div>
    <div className={styles.adminProductActions}><EditProductModal product={p}/><Link href={"/product/"+(p.slug||p.id)} target="_blank"><ArrowUpRight size={14}/> View</Link></div>
   </div>
  </article>})}</div>
  {!products.length&&<div className={styles.emptyPanel}><Package size={28}/><b>No products yet</b><span>Add your first product to start selling.</span></div>}
 </section>
}