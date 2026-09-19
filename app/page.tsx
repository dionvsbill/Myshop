import Link from "next/link";
import {ChevronRight,Flame,ShieldCheck,Truck} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FeaturedSlider,{type Item} from "../components/FeaturedSlider";
import MobileBottomNav from "../components/MobileBottomNav";
import ProductCard,{type ProductCardItem} from "../components/ProductCard";
import styles from "../components/home.module.css";
import {createClient} from "../lib/supabase/server";
import {recommendProducts} from "../lib/recommendations";

export default async function Home(){
 const s=await createClient();
 const [{data:cats},{data:all},{data:{user}}]=await Promise.all([
  s.from("categories").select("id,name,slug").limit(12),
  s.from("products").select("id,slug,title,price,compare_price,images,is_featured,rating,review_count,stock,created_at,category_id,brand,tags,categories(name)").eq("is_active",true).limit(100),
  s.auth.getUser()
 ]);
 const products:ProductCardItem[]=(all||[]).map((p:any)=>({...p,categories:Array.isArray(p.categories)?(p.categories[0]||null):(p.categories||null)}));
 let views:string[]=[];let searches:string[]=[];
 if(user){const [{data:v},{data:q}]=await Promise.all([s.from("product_views").select("product_id").eq("user_id",user.id).order("created_at",{ascending:false}).limit(30),s.from("user_searches").select("query").eq("user_id",user.id).order("created_at",{ascending:false}).limit(30)]);views=(v||[]).map((x:any)=>x.product_id);searches=(q||[]).map((x:any)=>x.query);}
 const recommended=recommendProducts(products as any,{views,searches},{limit:16});
 const used=new Set(recommended.map(x=>x.id));
 const featured:Item[]=recommendProducts(products as any,{views,searches},{limit:8}).map(p=>p as any);
 featured.forEach(x=>used.add(x.id));
 const deals=products.filter(p=>p.compare_price&&Number(p.compare_price)>Number(p.price)&&!used.has(p.id)).sort(()=>Math.random()-.5).slice(0,10);
 deals.forEach(x=>used.add(x.id));
 const fresh=recommendProducts(products as any,{views,searches},{limit:12}).filter(x=>!used.has(x.id));
 return <><Header categories={cats||[]}/><main className={styles.home}><div className="container"><div className={styles.heroRow}><div className={styles.categoryRail}>{(cats||[]).slice(0,10).map((c:any)=><Link key={c.id} href={"/products?category="+c.slug} className={styles.category}>{c.name}<ChevronRight size={13}/></Link>)}</div><FeaturedSlider items={featured}/></div>
 <div className={styles.serviceRow}><div className={styles.service}><Truck size={20}/><div><b>Fast delivery</b><p>Track every order</p></div></div><div className={styles.service}><ShieldCheck size={20}/><div><b>Secure shopping</b><p>Protected checkout</p></div></div><div className={styles.service}><Flame size={20}/><div><b>Hot deals</b><p>Limited stock offers</p></div></div></div>
 {deals.length>0&&<section className={styles.darkSection}><div className={styles.sectionHead}><h2 className={styles.sectionTitle}>Black Friday deals</h2><Link href="/products" className={styles.seeAll}>See all</Link></div><div className={styles.darkGrid}>{deals.map(p=><ProductCard key={p.id} product={p}/>)}</div></section>}
 <section className={styles.section}><div className={styles.sectionHead}><h2 className={styles.sectionTitle}>Recommended for you</h2><Link href="/products" className={styles.seeAll}>See all</Link></div><div className={styles.grid}>{recommended.filter(p=>!deals.some(d=>d.id===p.id)).slice(0,10).map(p=><ProductCard key={p.id} product={p}/>)}</div></section>
 <section className={styles.section}><div className={styles.sectionHead}><h2 className={styles.sectionTitle}>New & popular</h2><Link href="/products" className={styles.seeAll}>More</Link></div><div className={styles.grid}>{fresh.slice(0,10).map(p=><ProductCard key={p.id} product={p}/>)}</div></section>
 </div></main><Footer/><MobileBottomNav/></>
}