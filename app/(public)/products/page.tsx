import {Search} from "lucide-react";
import {createClient} from "../../../lib/supabase/server";
import RecommendationTracker from "../../../components/RecommendationTracker";
import ProductCard from "../../../components/ProductCard";
import styles from "../../../components/home.module.css";
import {recommendProducts} from "../../../lib/recommendations";

export default async function Products({ searchParams }: { searchParams: { q?: string; category?: string } }) {
  const s=await createClient();
  let query=s.from("products").select("id,slug,title,price,compare_price,images,rating,review_count,stock,created_at,category_id,brand,tags,categories(name,slug)").eq("is_active",true);
  if(searchParams.q) query=query.ilike("title","%"+searchParams.q+"%");
  if(searchParams.category) query=query.eq("categories.slug",searchParams.category);
  const [{data,error},{data:{user}}]=await Promise.all([query.limit(100),s.auth.getUser()]);
  if(error)return <section className={styles.section}><h1 className={styles.sectionTitle}>Unable to load products</h1><p>{error.message}</p></section>;
  let views:string[]=[];let searches:string[]=[];
  if(user){const [{data:v},{data:q}]=await Promise.all([s.from("product_views").select("product_id").eq("user_id",user.id).order("created_at",{ascending:false}).limit(30),s.from("user_searches").select("query").eq("user_id",user.id).order("created_at",{ascending:false}).limit(30)]);views=(v||[]).map((x:any)=>x.product_id);searches=(q||[]).map((x:any)=>x.query);}
  const products=(data||[]) as any[]; const ordered=searchParams.q?products:recommendProducts(products,{views,searches},{limit:products.length});
  return <section className={styles.home}><RecommendationTracker query={searchParams.q}/><div className={styles.section} style={{marginTop:12}}><div className={styles.sectionHead}><div><p className="eyebrow">Marketplace</p><h1 className={styles.sectionTitle}>All products</h1><p style={{fontSize:11,color:"#777",marginTop:3}}>{products.length} products available</p></div><form action="/products" className="productsSearch"><Search size={17}/><input name="q" defaultValue={searchParams.q||""} placeholder="Search products, brands and categories"/><button>Search</button></form></div></div><div className={styles.section}><div className={styles.grid}>{ordered.map((p:any)=><ProductCard key={p.id} product={p}/>)}</div></div></section>;
}