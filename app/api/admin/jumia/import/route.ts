import {NextRequest,NextResponse} from "next/server";
import {createClient} from "../../../../lib/supabase/server";
function clean(v:string){return v.replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").trim()}
function meta(html:string,name:string){const r=new RegExp('<meta[^>]+(?:property|name)=["\\']'+name+'["\\'][^>]+content=["\\']([^"\\']+)["\\']','i').exec(html)||new RegExp('<meta[^>]+content=["\\']([^"\\']+)["\\'][^>]+(?:property|name)=["\\']'+name+'["\\']','i').exec(html);return r?clean(r[1]):""}
function scripts(html:string){return [...html.matchAll(/<script[^>]*type=["']application\\/ld\\+json["'][^>]*>([\\s\\S]*?)<\\/script>/gi)].map(x=>x[1].trim()).flatMap(x=>{try{return [JSON.parse(x)]}catch{return []}})}
function findProduct(v:any):any{if(!v)return null;if(Array.isArray(v)){for(const x of v){const p=findProduct(x);if(p)return p}return null}if(typeof v!=="object")return null;if(v["@type"]==="Product"||(Array.isArray(v["@type"])&&v["@type"].includes("Product")))return v;for(const x of Object.values(v)){const p=findProduct(x);if(p)return p}return null}
function arr(v:any){return Array.isArray(v)?v:[v].filter(Boolean)}
function num(v:any){const n=Number(String(v??"").replace(/[^0-9.]/g,""));return Number.isFinite(n)?n:null}
function slugify(s:string){return s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,90)||"jumia-product"}
export async function POST(req:NextRequest){
 const s=await createClient();const {data:u}=await s.auth.getUser();if(!u.user)return NextResponse.json({error:"Authentication required"},{status:401});
 const {data:profile}=await s.from("profiles").select("role").eq("id",u.user.id).maybeSingle();if(profile?.role!=="ADMIN")return NextResponse.json({error:"Admin access required"},{status:403});
 const {url}=await req.json();if(typeof url!=="string"||!/^https:\/\/www\.jumia\.com\.gh\//i.test(url))return NextResponse.json({error:"Paste a Jumia Ghana product URL."},{status:400});
 const res=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 (compatible; Myshop Jumia importer/1.0)","Accept":"text/html,application/xhtml+xml"},cache:"no-store"});if(!res.ok)return NextResponse.json({error:"Jumia returned HTTP "+res.status+"."},{status:502});
 const html=await res.text();const p=findProduct(scripts(html));const title=clean(p?.name||meta(html,"og:title"));if(!title)return NextResponse.json({error:"Could not read product details from this Jumia page."},{status:422});
 const canonical=clean(p?.url||meta(html,"og:url")||url.split("?")[0]);const id=(canonical.match(/-(\d+)\.html(?:$|\?)/i)||[])[1]||null;
 const rawImages=arr(p?.image).concat([meta(html,"og:image")]).filter(Boolean).map((x:any)=>String(x).trim()).filter((x,i,a)=>a.indexOf(x)===i);
 const offers=Array.isArray(p?.offers)?p.offers[0]:p?.offers;const rating=p?.aggregateRating;
 const features=arr(p?.additionalProperty).map((x:any)=>({name:x?.name||"",value:x?.value||""})).filter((x:any)=>x.name||x.value);const specifications:Record<string,string>={};for(const x of features)if(x.name)specifications[x.name]=String(x.value);
 const payload={jumia_product_id:id,source_url:canonical,title,slug:slugify(title)+"-"+(id||Date.now()),description:clean(p?.description||meta(html,"description")),brand:typeof p?.brand==="object"?p.brand?.name:p?.brand||null,sku:p?.sku||null,price:num(offers?.price),compare_price:null,currency:offers?.priceCurrency||"GHS",discount_percent:null,rating:num(rating?.ratingValue),review_count:Number(rating?.reviewCount||rating?.ratingCount||0)||0,stock_status:offers?.availability||null,images:rawImages,features,specifications,seller:typeof offers?.seller==="object"?offers.seller?.name:offers?.seller||null,category:typeof p?.category==="string"?p.category:null,jforce_url:"https://jforce.jumia.com.gh/s/iHaN1Ck",is_active:true,last_synced_at:new Date().toISOString()};
 const existing=await s.from("jumia_products").select("id").eq("source_url",canonical).maybeSingle();const q=existing.data?await s.from("jumia_products").update(payload).eq("id",existing.data.id).select("*").single():await s.from("jumia_products").insert(payload).select("*").single();
 if(q.error)return NextResponse.json({error:q.error.message},{status:400});return NextResponse.json({product:q.data});
}