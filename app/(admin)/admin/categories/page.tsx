import {FolderTree,ChevronRight,Layers3} from "lucide-react";
import Link from "next/link";
import {createClient} from "../../../../lib/supabase/server";
import styles from "../../../../admin/admin.module.css";

export default async function Categories(){
 const s=await createClient();
 const {data,error}=await s.from("categories").select("id,name,slug").order("name");
 if(error)throw new Error(error.message);
 const categories=data||[];
 return <section className={styles.adminPage}>
  <div className={styles.pageIntro}>
   <div><p className={styles.kicker}>Catalogue</p><h2>Categories</h2><p>Keep your catalogue organised with clear shopping collections.</p></div>
   <div className={styles.pageStat}><Layers3 size={17}/><span><b>{categories.length}</b> collections</span></div>
  </div>
  <div className={styles.categoryToolbar}><div><b>All categories</b><small>Browse your current catalogue structure</small></div><span>{categories.length} total</span></div>
  {categories.length?<div className={styles.categoryAdminGrid}>{categories.map(c=><Link href={"/products?category="+encodeURIComponent(c.slug)} key={c.id} className={styles.categoryCard}>
    <div className={styles.categoryIcon}><FolderTree size={18}/></div><div className={styles.categoryInfo}><b>{c.name}</b><small>/{c.slug}</small><span>Open collection</span></div><ChevronRight size={16} className={styles.categoryArrow}/>
  </Link>)}</div>:<div className={styles.emptyPanel}><FolderTree size={28}/><b>No categories yet</b><span>Create categories to organise products.</span></div>}
 </section>
}