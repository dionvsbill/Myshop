import {NextRequest,NextResponse} from "next/server";
import {createClient} from "../../../../../lib/supabase/server";

function clean(v:any){return String(v??"").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\\\//g,"/").trim()}
function meta(html:string,name:string){
  const escaped=name.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g,"\\\\$&");
  const patterns=[
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`,"i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`,"i")
  ];
  for(const pattern of patterns){const match=pattern.exec(html);if(match)return clean(match[1])}
  return "";
}
function jsonScripts(html:string){
  const out:any[]=[];
  const re=/<script\b[^>]*?(?:type=["'](?:application\/ld\+json|application\/json)["'])?[^>]*>([\s\S]*?)<\/script>/gi;
  let m:RegExpExecArray|null;
  while((m=re.exec(html))!==null){
    const raw=m[1].trim();
    if(!raw||raw.length>1000000)continue;
    try{out.push(JSON.parse(raw))}catch{
      try{out.push(JSON.parse(raw.replace(/<!--|-->/g,"").trim()))}catch{}
    }
  }
  return out;
}
function findProduct(v:any):any{
  if(!v)return null;
  if(Array.isArray(v)){for(const x of v){const p=findProduct(x);if(p)return p}return null}
  if(typeof v!=="object")return null;
  const t=v["@type"];
  if(t==="Product"||(Array.isArray(t)&&t.some((x:any)=>String(x).toLowerCase()==="product")))return v;
  for(const x of Object.values(v)){const p=findProduct(x);if(p)return p}
  return null;
}
function arr(v:any){return Array.isArray(v)?v:[v].filter(Boolean)}
function num(v:any){
  if(v===null||v===undefined)return null;
  const s=String(v).replace(/&nbsp;/gi," ").replace(/GH₵|GHS|GHC|GH\s*₵|₵/gi,"").replace(/,/g,"").trim();
  const m=s.match(/\d+(?:\.\d{1,2})?/);
  if(!m)return null;
  const n=Number(m[0]);
  return Number.isFinite(n)&&n>0?n:null;
}
function productId(url:string){return (url.match(/-(\d+)\.html(?:$|[?#])/i)||[])[1]||null}
function searchQueryFromUrl(url:string){
  const m=url.match(/jumia\.com\.gh\/([^/?#]+?)-\d+\.html/i);
  return m?m[1].replace(/[-_]+/g," ").trim():"";
}
function extractCatalogProduct(html:string,sourceId:string){
  const needle=new RegExp("(?:https?:\\/\\/www\\.jumia\\.com\\.gh)?[^\\\"'<>\\s]*-"+sourceId+"\\.html(?:[?#][^\\\"'<>\\s]*)?","i");
  const match=needle.exec(html);
  if(!match)return null;
  const pos=match.index;
  const window=html.slice(Math.max(0,pos-5000),Math.min(html.length,pos+12000));
  const titleAttr=new RegExp("(?:aria-label|title)=[\\\"']([^\\\"']+)[\\\"']","i");
  const titleHeading=new RegExp("<h[1-6][^>]*>([\\s\\S]*?)</h[1-6]>","i");
  const pricePattern=new RegExp("(?:GH₵|GHS|GHC|GH\\s*₵|₵)\\s*[0-9][0-9,\\s]*(?:\\.[0-9]{1,2})?","i");
  const imageAttr=new RegExp("(?:src|data-src|data-image|data-original)=[\\\"']([^\\\"']+)[\\\"']","i");
  const titleMatch=titleAttr.exec(window)||titleHeading.exec(window);
  const priceMatch=pricePattern.exec(window);
  const imageMatch=imageAttr.exec(window);
  const title=clean(titleMatch?.[1]||"").replace(/<[^>]+>/g," ");
  const price=num(priceMatch?.[0]);
  const image=clean(imageMatch?.[1]||"");
  return {title,price,images:isJumiaImage(image)?[image]:extractImages(window)};
}
function findJumiaData(v:any):any{
  if(!v||typeof v!=="object")return null;
  if(Array.isArray(v)){for(const x of v){const found=findJumiaData(x);if(found)return found}return null}
  const hasProduct=typeof v.name==="string"&&(
    v.price!==undefined||v.images!==undefined||v.image!==undefined||v.productId!==undefined||v.sku!==undefined
  );
  if(hasProduct)return v;
  for(const x of Object.values(v)){const found=findJumiaData(x);if(found)return found}
  return null;
}
function normalizeJumiaApiProduct(data:any,sourceId:string){
  const p=findJumiaData(data);
  if(!p)return null;
  const priceValue=p.price?.current??p.price?.value??p.price?.amount??p.price;
  const images=imageValues(p.images||p.image||p.media).filter(isJumiaImage);
  return {
    product:p,
    title:clean(p.name||p.title),
    price:num(priceValue),
    images
  };
}
async function productApiFallback(sourceId:string){
  if(!sourceId)return null;
  const endpoints=[
    "https://www.jumia.com.gh/_ms/catalog/product/detail?productId="+encodeURIComponent(sourceId),
    "https://www.jumia.com.gh/api/catalog/product/detail?productId="+encodeURIComponent(sourceId)
  ];
  for(const url of endpoints){
    try{
      const r=await fetch(url,{
        headers:{
          "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
          "Accept":"application/json,text/plain,*/*",
          "Accept-Language":"en-US,en;q=0.9",
          "Referer":"https://www.jumia.com.gh/"
        },
        cache:"no-store"
      });
      if(!r.ok)continue;
      const text=await r.text();
      if(!text)continue;
      try{
        const data=JSON.parse(text);
        const normalized=normalizeJumiaApiProduct(data,sourceId);
        if(normalized)return normalized;
      }catch{}
    }catch{}
  }
  return null;
}

async function jinaFetch(url:string){
  const headers={
    "Accept":"text/plain,text/markdown,*/*",
    "X-Engine":"browser",
    "X-Proxy":"gh",
    "X-No-Cache":"true",
    "X-Timeout":"30",
    "X-User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
    "X-Referer":"https://www.google.com/"
  };
  return fetchText("https://r.jina.ai/"+url,headers);
}
async function jinaSearch(query:string){
  const headers={
    "Accept":"text/plain,text/markdown,*/*",
    "X-Engine":"browser",
    "X-Proxy":"gh",
    "X-No-Cache":"true",
    "X-Timeout":"30"
  };
  return fetchText("https://s.jina.ai/?q="+encodeURIComponent(query),headers);
}

async function catalogFallback(normalized:string,sourceId:string){
  const q=searchQueryFromUrl(normalized);
  if(!q)return null;

  // Jumia can block Render's IP while the same public page is available through
  // a browser-rendered Reader proxy. Search the exact product id first so we do
  // not accidentally import another product from the catalogue.
  const exact=await jinaSearch("site:jumia.com.gh "+sourceId+" "+q);
  if(exact.text){
    const exactProduct=extractCatalogProduct(exact.text,sourceId);
    if(exactProduct?.price!=null&&(exactProduct.images?.length||exactProduct.title))return exactProduct;
  }

  const url="https://www.jumia.com.gh/catalog/?q="+encodeURIComponent(q);
  const r=await jinaFetch(url);
  if(r.text){
    const product=extractCatalogProduct(r.text,sourceId);
    if(product)return product;
  }

  return null;
}
function titleFromUrl(url:string){
  const m=url.match(/jumia\.com\.gh\/([^/?#]+?)-(\d+)\.html/i);
  return m?clean(m[1].replace(/[-_]+/g," ").replace(/\b\w/g,(x:string)=>x.toUpperCase())):"";
}
function imageValues(v:any):string[]{
  if(!v)return [];
  if(typeof v==="string")return [v];
  if(Array.isArray(v))return v.flatMap(imageValues);
  if(typeof v==="object")return imageValues(v.url||v.contentUrl||v.src||v.originalUrl||v.image);
  return [];
}
function isJumiaImage(v:string){
  const x=clean(v).replace(/\\/g,"").replace(/\\\//g,"/");
  return /^https?:\/\//i.test(x)&&/^(?:[^/]+\.)?(?:jumia\.(?:is|com\.gh)|static\.jumia\.com\.gh)\//i.test(x)&&
    !/(?:favicon|logo|sprite|icon|placeholder)/i.test(x);
}
function extractImages(source:string){
  source=source.replace(/\\\\\(/g,"(").replace(/\\\\\)/g,")").replace(/\\\\\_/g,"_");
  const out:string[]=[];
  const add=(v:string)=>{
    const x=clean(v).replace(/\\/g,"").replace(/\\\//g,"/").trim();
    if(isJumiaImage(x)&&out.indexOf(x)===-1)out.push(x);
  };
  const attr=/\b(?:src|data-src|data-original|data-image|data-lazy-src|data-original-src|content)=["']([^"']+)["']/gi;
  let m:RegExpExecArray|null;
  while((m=attr.exec(source))!==null){
    m[1].split(/\s*,\s*|\s+/).forEach(add);
    if(out.length>=40)break;
  }
  const urls=source.replace(/\\\//g,"/").match(/https?:\/\/[^\s"'<>]+/gi)||[];
  for(const u of urls){add(u);if(out.length>=40)break}
  return out;
}
function parseEmbedded(html:string){
  let product:any=null;
  for(const x of jsonScripts(html)){product=product||findProduct(x)}
  const next=/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i.exec(html);
  if(next){try{product=product||findProduct(JSON.parse(next[1]))}catch{}}
  return product;
}
function extractPrice(html:string){
  const candidates=[
    meta(html,"product:price:amount"),meta(html,"og:price:amount"),meta(html,"price"),
    ...(html.match(/(?:GH₵|GHS|GHC|GH\s*₵|₵)\s*[0-9][0-9,\s]*(?:\.[0-9]{1,2})?/gi)||[])
  ];
  for(const x of candidates){const n=num(x);if(n!=null)return n}
  return null;
}
function readerData(text:string,url:string){
  const title=(text.match(/^#\s+(.+)$/m)||text.match(/^(?:Title|Product name)\s*:\s*(.+)$/im)||[])[1]||"";
  const price=extractPrice(text);
  return {title:clean(title),price,images:extractImages(text),url};
}
async function fetchText(url:string,headers:Record<string,string>={}){
  try{
    const r=await fetch(url,{headers,cache:"no-store",redirect:"follow"});
    if(!r.ok)return {status:r.status,text:""};
    const text=await r.text();
    return {status:r.status,text:text.length>200?text:""};
  }catch{return {status:0,text:""}}
}

export async function POST(req:NextRequest){
  const s=await createClient();
  const {data:u}=await s.auth.getUser();
  if(!u.user)return NextResponse.json({error:"Authentication required"},{status:401});
  const {data:profile}=await s.from("profiles").select("role").eq("id",u.user.id).maybeSingle();
  if(profile?.role!=="ADMIN")return NextResponse.json({error:"Admin access required"},{status:403});

  const body=await req.json();
  const input=typeof body?.url==="string"?body.url.trim():"";
  const normalized=input.replace(/^http:\/\//i,"https://").replace(/^https:\/\/(?!www\.)jumia\.com\.gh\//i,"https://www.jumia.com.gh/");
  if(!/^https:\/\/www\.jumia\.com\.gh\/[^?#]+-\d+\.html(?:[?#].*)?$/i.test(normalized)){
    return NextResponse.json({error:"Paste a Jumia Ghana product URL."},{status:400});
  }

  const sourceId=productId(normalized);
  let html="";
  let directStatus=0;
  let product:any=null;
  let fallback:any={};

  const sources: Array<{url:string;headers:Record<string,string>}>=[
    {url:normalized,headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36","Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8","Accept-Language":"en-US,en;q=0.9","Referer":"https://www.google.com/"}},
    {url:"https://r.jina.ai/"+normalized,headers:{"User-Agent":"Mozilla/5.0","Accept":"text/plain,text/markdown,*/*","X-Engine":"browser","X-Proxy":"gh","X-No-Cache":"true","X-Timeout":"30","X-User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36","X-Referer":"https://www.google.com/"}},
    {url:"https://www-jumia-com-gh.translate.goog/"+normalized.split("/").slice(3).join("/")+"?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=en",headers:{"User-Agent":"Mozilla/5.0","Accept":"text/html,application/xhtml+xml,*/*;q=0.8"}}
  ];

  for(const source of sources){
    const r=await fetchText(source.url,source.headers);
    if(source.url===normalized)directStatus=r.status;
    if(!r.text)continue;
    if(!html)html=r.text;
    const candidate=parseEmbedded(r.text);
    const candidateTitle=clean(candidate?.name||meta(r.text,"og:title")||meta(r.text,"twitter:title"));
    const candidateImages=imageValues(candidate?.image).concat([meta(r.text,"og:image"),meta(r.text,"twitter:image")],extractImages(r.text)).filter(isJumiaImage);
    const offers=Array.isArray(candidate?.offers)?candidate.offers[0]:candidate?.offers;
    const candidatePrice=num(offers?.price??candidate?.price)??extractPrice(r.text);
    if(candidate?.name||candidateTitle)product=product||candidate;
    fallback={...fallback,title:fallback.title||candidateTitle,images:[...(fallback.images||[]),...candidateImages],price:fallback.price??candidatePrice};
    if(product?.name&&candidateImages.length&&candidatePrice!=null)break;
  }

  if(!product?.name||!fallback.images?.length||fallback.price==null){
    const apiProduct=sourceId?await productApiFallback(sourceId):null;
    if(apiProduct){
      product=product||apiProduct.product;
      fallback={
        ...fallback,
        title:fallback.title||apiProduct.title,
        images:[...(fallback.images||[]),...(apiProduct.images||[])],
        price:fallback.price??apiProduct.price
      };
    }
  }

  if(!product?.name||!fallback.images?.length||fallback.price==null){
    const catalog=sourceId?await catalogFallback(normalized,sourceId):null;
    if(catalog){
      fallback={...fallback,title:fallback.title||catalog.title,images:[...(fallback.images||[]),...(catalog.images||[])],price:fallback.price??catalog.price};
    }
  }

  if(!product?.name||!fallback.images?.length||fallback.price==null){
    const reader=await jinaFetch(normalized);
    if(reader.text){
      const d=readerData(reader.text,normalized);
      fallback={...fallback,title:fallback.title||d.title,images:[...(fallback.images||[]),...d.images],price:fallback.price??d.price};
    }
  }

  const rawTitle=clean(product?.name||fallback.title||meta(html,"og:title")||meta(html,"twitter:title"));
  const title=/^(search results|search|jumia)$/i.test(rawTitle)?"":rawTitle;
  const offers=Array.isArray(product?.offers)?product.offers[0]:product?.offers;
  const images=imageValues(product?.image).concat(fallback.images||[],meta(html,"og:image"),meta(html,"twitter:image"),extractImages(html))
    .map(clean).filter(isJumiaImage).filter((x,i,a)=>a.indexOf(x)===i);
  const price=num(offers?.price)??num(product?.price)??fallback.price??extractPrice(html);

  if(!title||!images.length||price==null){
    const missing=[!title?"title":null,!images.length?"image":null,price==null?"price":null].filter(Boolean);
    const reason=directStatus===403||directStatus===429
      ?"Jumia blocked the server request."
      :directStatus===404
        ?"Jumia returned this product as unavailable (404)."
        :"Jumia returned the page, but the required product fields could not be verified.";
    return NextResponse.json({error:"Could not import this Jumia product.",details:reason,missing,product_id:sourceId},{status:422});
  }

  const canonical=clean(product?.url||meta(html,"og:url")||normalized.split("?")[0]);
  const id=productId(canonical)||sourceId;
  const rating=product?.aggregateRating;
  const features=arr(product?.additionalProperty).map((x:any)=>({name:clean(x?.name),value:clean(x?.value)})).filter((x:any)=>x.name||x.value);
  const specifications:Record<string,string>={};
  for(const x of features)if(x.name)specifications[x.name]=x.value;

  const payload={
    jumia_product_id:id,
    source_url:canonical,
    title,
    slug:title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,90)+"-"+id,
    description:clean(product?.description||meta(html,"description")),
    brand:typeof product?.brand==="object"?product.brand?.name:product?.brand||null,
    sku:product?.sku||null,
    price,
    compare_price:null,
    currency:offers?.priceCurrency||"GHS",
    discount_percent:null,
    rating:num(rating?.ratingValue),
    review_count:Number(rating?.reviewCount||rating?.ratingCount||0)||0,
    stock_status:offers?.availability||null,
    images,
    features,
    specifications,
    seller:typeof offers?.seller==="object"?offers.seller?.name:offers?.seller||null,
    category:typeof product?.category==="string"?product.category:null,
    jforce_url:"https://jforce.jumia.com.gh/s/iHaN1Ck",
    is_active:true,
    last_synced_at:new Date().toISOString()
  };

  const existing=await s.from("jumia_products").select("id").eq("jumia_product_id",id).maybeSingle();
  const q=existing.data
    ?await s.from("jumia_products").update(payload).eq("id",existing.data.id).select("*").single()
    :await s.from("jumia_products").insert(payload).select("*").single();

  if(q.error)return NextResponse.json({error:q.error.message},{status:400});
  return NextResponse.json({product:q.data,source:"jumia"});
}
