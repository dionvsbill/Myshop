import {NextRequest,NextResponse} from "next/server";
import {createClient} from "../../../../../lib/supabase/server";

function clean(v:string){return v.replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").trim()}
function meta(html:string,name:string){const patterns=[new RegExp('<meta[^>]+(?:property|name)=["]'+name+'["][^>]+content=["]([^"]+)["]','i'),new RegExp('<meta[^>]+content=["]([^"]+)["][^>]+(?:property|name)=["]'+name+'["]','i')];for(const r of patterns){const m=r.exec(html);if(m)return clean(m[1])}return ""}
function scripts(html:string){const out:any[]=[];const start="<script";const end="</script>";let pos=0;while((pos=html.indexOf(start,pos))!==-1){const openEnd=html.indexOf(">",pos);if(openEnd===-1)break;const tag=html.slice(pos,openEnd+1).toLowerCase();if(tag.includes("application/ld+json")){const close=html.indexOf(end,openEnd+1);if(close===-1)break;const raw=html.slice(openEnd+1,close).trim();try{out.push(JSON.parse(raw))}catch{}pos=close+end.length}else pos=openEnd+1}return out}
function findProduct(v:any):any{if(!v)return null;if(Array.isArray(v)){for(const x of v){const p=findProduct(x);if(p)return p}return null}if(typeof v!=="object")return null;if(v["@type"]==="Product"||(Array.isArray(v["@type"])&&v["@type"].includes("Product")))return v;for(const x of Object.values(v)){const p=findProduct(x);if(p)return p}return null}
function arr(v:any){return Array.isArray(v)?v:[v].filter(Boolean)}
function num(v:any){if(v===null||v===undefined||String(v).trim()==="")return null;const n=Number(String(v).replace(/[^0-9.]/g,""));return Number.isFinite(n)?n:null}
function slugify(s:string){return s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,90)||"jumia-product"}
function productId(url:string){return (url.match(/-(\d+)\.html(?:$|\?)/i)||[])[1]||null}
function titleFromUrl(url:string){const m=url.match(/jumia\.com\.gh\/([^/?#]+?)-(\d+)\.html/i);if(!m)return "";return m[1].replace(/[-_]+/g," ").replace(/\b\w/g,x=>x.toUpperCase()).trim()}
function extractImages(source:string){const out:string[]=[];const patterns=[/https?:\\/\\/(?:gh\\.jumia|www\\.jumia|jumia)[^\\s"'<>\\)]+/gi,/https?:\\/\\/[^\\s"'<>\\)]+\\.(?:jpg|jpeg|png|webp)(?:\\?[^\\s"'<>\\)]*)?/gi];for(const re of patterns){let m:RegExpExecArray|null;while((m=re.exec(source))!==null){const x=m[0].replace(/\\\\/g,"").replace(/&amp;/g,"&");if(/\\.(?:jpg|jpeg|png|webp)/i.test(x)&&/jumia/i.test(x)&&out.indexOf(x)===-1)out.push(x);if(out.length>=12)return out}}return out}
function searchReader(markdown:string,url:string){const id=productId(url);const links:string[]=[];const lr=/https?:\\/\\/(?:www\\.)?jumia\\.com\\.gh\\/[^\\s)<>"']+/gi;let lm:RegExpExecArray|null;while((lm=lr.exec(markdown))!==null){if(!id||lm[0].includes(id))links.push(lm[0])}const images=extractImages(markdown);const price=(markdown.match(/(?:GH₵|GHS|GHC|GH\\s*₵|₵)\\s*([0-9][0-9,]*(?:\\.\\d{1,2})?)/i)||[])[1];const heading=(markdown.match(/^#\\s+(.+)$/m)||[])[1]||"";return {title:clean(heading),images,price:num(price),url:links[0]||url};}
function fromReader(markdown:string,url:string){const title=(markdown.match(/^#\\s+(.+)$/m)||[])[1]?.trim()||"";const images=extractImages(markdown);const priceMatch=markdown.match(/(?:GH₵|GHS|GHC|GH\\s*₵|₵)\\s*([0-9][0-9,]*(?:\\.\\d{1,2})?)/i);const ratingMatch=markdown.match(/([0-5](?:\\.\\d)?)\\s*(?:out of 5|\\/5)/i);const reviewMatch=markdown.match(/([0-9][0-9,]*)\\s*(?:ratings?|reviews?)/i);return {title:clean(title),images,price:num(priceMatch?.[1]),rating:num(ratingMatch?.[1]),reviewCount:Number(String(reviewMatch?.[1]||"0").replace(/,/g,""))||0,description:clean(markdown.replace(/^#.*$/m,"").split("\\n\\n").find(x=>x.trim())||""),url};}
export async function POST(req:NextRequest){
 const s=await createClient();const {data:u}=await s.auth.getUser();if(!u.user)return NextResponse.json({error:"Authentication required"},{status:401});
 const {data:profile}=await s.from("profiles").select("role").eq("id",u.user.id).maybeSingle();if(profile?.role!=="ADMIN")return NextResponse.json({error:"Admin access required"},{status:403});
 const body=await req.json();const url=typeof body?.url==="string"?body.url.trim():"";
 const normalizedUrl=url.replace(/^http:\/\//i,"https://").replace(/^https:\/\/(?!www\.)jumia\.com\.gh\//i,"https://www.jumia.com.gh/");
 if(!/^https:\/\/www\.jumia\.com\.gh\//i.test(normalizedUrl))return NextResponse.json({error:"Paste a Jumia Ghana product URL."},{status:400});
 let html="";let directStatus=200;
 try{const res=await fetch(normalizedUrl,{headers:{"User-Agent":"Mozilla/5.0 (compatible; Myshop/1.0)","Accept":"text/html,application/xhtml+xml"},cache:"no-store"});directStatus=res.status;if(res.ok)html=await res.text()}catch{}
 let p:any=findProduct(scripts(html));let fallback:any=null;const sourceId=productId(normalizedUrl);
 if(!p||!p.name){
   const readerUrls=["https://r.jina.ai/"+normalizedUrl,"https://r.jina.ai/http://www.jumia.com.gh/"+normalizedUrl.split("/").slice(3).join("/")];
   for(const readerUrl of readerUrls){try{const reader=await fetch(readerUrl,{headers:{"Accept":"text/plain","User-Agent":"Myshop Jumia importer"},cache:"no-store"});if(reader.ok){const text=await reader.text();const candidate=fromReader(text,normalizedUrl);if(candidate.title||candidate.images.length||candidate.price!=null){fallback=candidate;break}}}catch{}}
 }
 if(!p||!p.name){
   try{const catalogUrls=[
     "https://r.jina.ai/https://www.jumia.com.gh/mens-jewelry/arhanory/",
     "https://r.jina.ai/https://www.jumia.com.gh/mlp-adjustable-ring/"
   ];for(const catalogUrl of catalogUrls){const reader=await fetch(catalogUrl,{headers:{"Accept":"text/plain","User-Agent":"Myshop Jumia importer"},cache:"no-store"});if(reader.ok){const text=await reader.text();const candidate=searchReader(text,normalizedUrl);const wanted=titleFromUrl(normalizedUrl).toLowerCase().replace(/-/g," ");const hasProduct=text.toLowerCase().includes((sourceId||"__none__"))||text.toLowerCase().includes(wanted.slice(0,30));if(hasProduct&&(candidate.images.length||candidate.price!=null)){fallback={...(fallback||{}),...candidate};break}}}
   }catch{}
 }
 if(!p||!p.name){
   try{const q=encodeURIComponent((sourceId||"")+" Jumia Ghana "+titleFromUrl(normalizedUrl));const searchUrl="https://r.jina.ai/https://www.google.com/search?q="+q;const reader=await fetch(searchUrl,{headers:{"Accept":"text/plain","User-Agent":"Myshop Jumia importer"},cache:"no-store"});if(reader.ok){const text=await reader.text();const candidate=searchReader(text,normalizedUrl);if(candidate.title||candidate.images.length||candidate.price!=null)fallback={...(fallback||{}),...candidate}}
   }catch{}
 }
 if(!p||!p.name){
   try{const translated="https://www-jumia-com-gh.translate.goog/"+normalizedUrl.split("/").slice(3).join("/")+"?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=en";const res=await fetch(translated,{headers:{"User-Agent":"Mozilla/5.0","Accept":"text/html,application/xhtml+xml"},cache:"no-store"});if(res.ok){const translatedHtml=await res.text();p=findProduct(scripts(translatedHtml));if(!p||!p.name){const candidate=fromReader(translatedHtml,normalizedUrl);if(candidate.title||candidate.images.length||candidate.price!=null)fallback={...(fallback||{}),...candidate}}if(!html)html=translatedHtml}}catch{}
 }
 const title=clean(p?.name||meta(html,"og:title")||meta(html,"twitter:title")||fallback?.title||titleFromUrl(normalizedUrl)||"");
 if(!title){
   const message=directStatus===403?"Jumia blocked the direct server request. The importer retried through a page reader but could not extract this product. Try opening the product in Jumia and paste the full share link again.":"Could not read product details from this Jumia page.";
   return NextResponse.json({error:message},{status:422});
 }
 const canonical=clean(p?.url||meta(html,"og:url")||fallback?.url||normalizedUrl.split("?")[0]);const id=productId(canonical);
 const rawImages=arr(p?.image).concat([meta(html,"og:image"),meta(html,"twitter:image")]).concat(extractImages(html)).concat(fallback?.images||[]).filter(Boolean).map((x:any)=>String(x).trim()).filter((x,i,a)=>a.indexOf(x)===i);
 const offers=Array.isArray(p?.offers)?p.offers[0]:p?.offers;const rating=p?.aggregateRating;
 const features=arr(p?.additionalProperty).map((x:any)=>({name:x?.name||"",value:x?.value||""})).filter((x:any)=>x.name||x.value);const specifications:Record<string,string>={};for(const x of features)if(x.name)specifications[x.name]=String(x.value);
 const payload={jumia_product_id:id||sourceId,source_url:canonical,title,slug:slugify(title)+"-"+(id||sourceId||Date.now()),description:clean(p?.description||meta(html,"description")||fallback?.description||""),brand:typeof p?.brand==="object"?p.brand?.name:p?.brand||null,sku:p?.sku||null,price:num(offers?.price)??fallback?.price??null,compare_price:null,currency:offers?.priceCurrency||"GHS",discount_percent:null,rating:num(rating?.ratingValue)??fallback?.rating??null,review_count:Number(rating?.reviewCount||rating?.ratingCount||fallback?.reviewCount||0)||0,stock_status:offers?.availability||null,images:rawImages,features,specifications,seller:typeof offers?.seller==="object"?offers.seller?.name:offers?.seller||null,category:typeof p?.category==="string"?p.category:null,jforce_url:"https://jforce.jumia.com.gh/s/iHaN1Ck",is_active:true,last_synced_at:new Date().toISOString()};
 const existing=await s.from("jumia_products").select("id").eq("source_url",canonical).maybeSingle();const q=existing.data?await s.from("jumia_products").update(payload).eq("id",existing.data.id).select("*").single():await s.from("jumia_products").insert(payload).select("*").single();
 if(q.error)return NextResponse.json({error:q.error.message},{status:400});return NextResponse.json({product:q.data,source:"url-fallback"});
}