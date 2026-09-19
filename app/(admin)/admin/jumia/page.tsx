"use client";
import {useEffect,useMemo,useState} from "react";
import {AlertCircle,ArrowUpRight,CheckCircle2,ExternalLink,Image as ImageIcon,Link2,Plus,RefreshCw,Search,ShoppingBag,Trash2} from "lucide-react";
import {createClient} from "../../../../lib/supabase/client";
import styles from "../../../admin/admin.module.css";

type Product={id:string;title:string;price:number|null;compare_price:number|null;images:string[];rating:number|null;review_count:number;stock_status:string|null;source_url:string;brand:string|null;is_active:boolean};

function cleanJumiaUrl(value:string){
 const text=value.replace(/\\n/g," ").replace(/\\r/g," ").trim();
 const m=text.match(/https?:\/\/(?:www\.)?jumia\.com\.gh\/[^\s<>"']+/i);
 return m?m[0].replace(/[.,;)]+$/,""):text;
}

export default function JumiaAdmin(){
 const[url,setUrl]=useState(""),[busy,setBusy]=useState(false),[msg,setMsg]=useState(""),[ok,setOk]=useState(false),[items,setItems]=useState<Product[]>([]),[search,setSearch]=useState("");
 async function load(){const{data}=await createClient().from("jumia_products").select("id,title,price,compare_price,images,rating,review_count,stock_status,source_url,brand,is_active").order("created_at",{ascending:false});setItems((data||[]) as Product[])}
 useEffect(()=>{void load()},[]);
 function handleUrlChange(value:string){setUrl(cleanJumiaUrl(value))}
 function handlePaste(e:React.ClipboardEvent<HTMLInputElement>){const pasted=e.clipboardData.getData("text");const extracted=cleanJumiaUrl(pasted);if(extracted!==pasted.trim()){e.preventDefault();setUrl(extracted)}}
 async function importProduct(e:React.FormEvent){e.preventDefault();const cleanUrl=cleanJumiaUrl(url);setUrl(cleanUrl);setBusy(true);setMsg("");setOk(false);try{const r=await fetch("/api/admin/jumia/import",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({url:cleanUrl})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Import failed");setMsg("Product imported successfully.");setOk(true);setUrl("");await load()}catch(e:any){setMsg(e.message||"Import failed.")}finally{setBusy(false)}}
 async function remove(id:string){if(!confirm("Remove this Jumia product from Myshop?"))return;const{error}=await createClient().from("jumia_products").delete().eq("id",id);if(error){setMsg(error.message);setOk(false)}else{setMsg("Product removed.");setOk(true);await load()}}
 const filtered=useMemo(()=>items.filter(p=>(p.title+" "+(p.brand||"")).toLowerCase().includes(search.toLowerCase())),[items,search]);
 const active=items.filter(x=>x.is_active).length;
 return <section className={styles.jumiaPage}>
  <div className={styles.jumiaHeader}>
   <div>
    <div className={styles.jumiaKicker}><ShoppingBag size={13}/> JUMIA CATALOGUE</div>
    <h1>Jumia Store</h1>
    <p>Bring real Jumia Ghana products into Myshop. Customers see the catalogue here, then continue to Jumia for checkout, delivery and fulfilment.</p>
   </div>
   <a className={styles.jumiaBrowse} href="https://www.jumia.com.gh/" target="_blank" rel="noreferrer"><ExternalLink size={15}/> Browse Jumia</a>
  </div>

  <div className={styles.jumiaStats}>
   <div><span>Imported</span><strong>{items.length}</strong><small>Catalogue products</small></div>
   <div><span>Active</span><strong>{active}</strong><small>Visible to customers</small></div>
   <div><span>Checkout</span><strong>Jumia</strong><small>Customer completes purchase there</small></div>
  </div>

  <div className={styles.jumiaImport}>
   <div className={styles.jumiaImportHead}>
    <div className={styles.jumiaIcon}><Link2 size={18}/></div>
    <div><h2>Import a Jumia product</h2><p>Paste a normal product URL or the complete share message copied from your phone.</p></div>
   </div>
   <form onSubmit={importProduct}>
    <div className={styles.jumiaInputRow}>
     <input value={url} onChange={e=>handleUrlChange(e.target.value)} onPaste={handlePaste} placeholder="https://www.jumia.com.gh/product-name-123456.html" required/>
     <button disabled={busy}>{busy?<RefreshCw size={16} className={styles.spin}/>:<Plus size={16}/>} {busy?"Importing":"Import product"}</button>
    </div>
    <div className={styles.jumiaHint}><span>Works with:</span> Jumia product URL, copied Jumia share text, or a link containing tracking parameters.</div>
    {msg&&<div className={ok?styles.jumiaSuccess:styles.jumiaError}>{ok?<CheckCircle2 size={17}/>:<AlertCircle size={17}/>}<div><b>{ok?"Imported successfully":"Import could not be completed"}</b><p>{msg}</p></div></div>}
   </form>
  </div>

  <div className={styles.jumiaSectionHead}>
   <div><span className={styles.jumiaKicker}>CATALOGUE</span><h2>Imported products</h2><p>These products are sourced from Jumia and are not stored as Myshop inventory.</p></div>
   <div className={styles.jumiaSearch}><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search catalogue"/></div>
  </div>

  {filtered.length===0?<div className={styles.jumiaEmpty}><ImageIcon size={40}/><h3>{items.length?"No matching products":"Your catalogue is empty"}</h3><p>{items.length?"Try another search.":"Paste a Jumia product link above to import the first product."}</p></div>:
  <div className={styles.jumiaGrid}>{filtered.map(p=><article className={styles.jumiaCard} key={p.id}>
   <div className={styles.jumiaImage}>{p.images?.[0]?<img src={p.images[0]} alt={p.title}/>:<ImageIcon size={40}/>}<span>JUMIA</span></div>
   <div className={styles.jumiaCardBody}><div className={styles.jumiaMeta}><small>{p.brand||"Jumia product"}</small>{p.rating!=null&&<b>★ {p.rating}</b>}</div><h3>{p.title}</h3><div className={styles.jumiaPrice}><strong>{p.price!=null?"GH₵ "+Number(p.price).toLocaleString():"Price on Jumia"}</strong>{p.compare_price!=null&&<del>GH₵ {Number(p.compare_price).toLocaleString()}</del>}</div><div className={styles.jumiaCardActions}><a href={p.source_url} target="_blank" rel="noreferrer">View on Jumia <ArrowUpRight size={14}/></a><button onClick={()=>remove(p.id)} aria-label="Remove product"><Trash2 size={15}/></button></div></div>
  </article>)}</div>}
 </section>
}