import Link from "next/link";
import {ChevronRight,Flame,ShieldCheck,Truck} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FeaturedSlider,{type Item} from "../components/FeaturedSlider";
import MobileBottomNav from "../components/MobileBottomNav";
import ProductCard,{type ProductCardItem} from "../components/ProductCard";
import styles from "../components/home.module.css";
import {createClient} from "../lib/supabase/server";

export default async function Home(){
 const s=await createClient();
 const [{data:cats},{data:all}]=await Promise.all([
  s.from("categories").select("id,name,slug").limit(12),
  s.from("products").select("id,slug,title,price,compare_price,images,is_featured,rating,review_count,stock,created_at,categories(name)").eq("is_active",true).limit(100)
 ]);
 const products:ProductCardItem[]=(all||[]).map((p:any)=>({...p,categories:Array.isArray(p.categories)?(p.categories[0]||null):(p.categories||null)}));
 const featured:Item[]=([...products] as any).sort((a:any,b:any)=>Number(b.is_featured)-Number(a.is_featured)||Number(b.rating||0)-Number(a.rating||0)).slice(0,8);
 const deals=products.filter(p=>p.compare_price&&Number(p.compare_price)>Number(p.price)).slice(0,10);
 const rated=[...products].sort((a,b)=>Number(b.rating||0)-Number(a.rating||0));
 const fresh=[...products].sort((a,b)=>String(b.id).localeCompare(String(a.id))).slice(0,10);
 return <><Header/><main className={styles.home}><div className="container"><div className={styles.heroRow}><aside className={styles.categories}><div className={styles.categoryTitle}>Shop by category</div>{(cats||[]).slice(0,10).map((c:any)=><Link key={c.id} href={"/products?category="+c.slug} className={styles.category}>{c.name}<ChevronRight size={13}/></Link>)}</aside><FeaturedSlider items={featured}/></div>
 <div className={styles.serviceRow}><div className={styles.service}><Truck size={20}/><div><b>Fast delivery</b><p>Track every order</p></div></div><div className={styles.service}><ShieldCheck size={20}/><div><b>Secure shopping</b><p>Protected checkout</p></div></div><div className={styles.service}><Flame size={20}/><div><b>Hot deals</b><p>Limited stock offers</p></div></div></div>
 {deals.length>0&&<section className={styles.darkSection}><div className={styles.sectionHead}><h2 className={styles.sectionTitle}>Black Friday deals</h2><Link href="/products" className={styles.seeAll}>See all</Link></div><div className={styles.darkGrid}>{deals.slice(0,5).map(p=><ProductCard key={p.id} product={p}/>)}</div></section>}
 <section className={styles.section}><div className={styles.sectionHead}><h2 className={styles.sectionTitle}>Recommended for you</h2><Link href="/products" className={styles.seeAll}>See all</Link></div><div className={styles.grid}>{rated.slice(0,10).map(p=><ProductCard key={p.id} product={p}/>)}</div></section>
 <section className={styles.section}><div className={styles.sectionHead}><h2 className={styles.sectionTitle}>New & popular</h2><Link href="/products" className={styles.seeAll}>More</Link></div><div className={styles.grid}>{fresh.map(p=><ProductCard key={p.id} product={p}/>)}</div></section>
 </div></main><Footer/><MobileBottomNav/></>
}