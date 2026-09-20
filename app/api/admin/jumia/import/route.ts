import {NextRequest, NextResponse} from "next/server";
import {createClient} from "../../../../../lib/supabase/server";

function clean(v:any){
  return String(v ?? "")
    .replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'")
    .replace(/&lt;/g,"<").replace(/&gt;/g,">")
    .replace(/\\\//g,"/").trim();
}

function meta(html:string,name:string){
  const patterns=[
    new RegExp('<meta[^>]+(?:property|name)=["\']'+name+'["\'][^>]+content=["\']([^"\']+)["\']',"i"),
    new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']'+name+'["\']',"i")
  ];
  for(const p of patterns){const m=p.exec(html);if(m)return clean(m[1]);}
  return "";
}

function jsonLd(html:string){
  const out:any[]=[];
  const re=/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m:RegExpExecArray|null;
  while((m=re.exec(html))!==null){
    try{out.push(JSON.parse(m[1].trim()));}
    catch{try{out.push(JSON.parse(m[1].replace(/<!--|-->/g,"").trim()));}catch{}}
  }
  return out;
}

function findProduct(v:any):any{
  if(!v)return null;
  if(Array.isArray(v)){for(const x of v){const p=findProduct(x);if(p)return p;}return null;}
  if(typeof v!=="object")return null;
  const t=v["@type"];
  if(t==="Product"||(Array.isArray(t)&&t.some((x:any)=>String(x).toLowerCase()==="product")))return v;
  for(const x of Object.values(v)){const p=findProduct(x);if(p)return p;}
  return null;
}

function arr(v:any){return Array.isArray(v)?v:[v].filter(Boolean);}

function num(v:any){
  if(v===null||v===undefined)return null;
  let s=String(v).replace(/&nbsp;/gi," ").replace(/GH₵|GHS|GHC|GH\s*₵|₵/gi,"").trim();
  s=s.replace(/[^0-9.,\s-]/g,"").trim();
  const m=s.match(/-?\d[\d,\s]*(?:\.\d{1,2})?/);
  if(!m)return null;
  let raw=m[0].trim();
  raw=raw.includes(".")?raw.replace(/,/g,"").replace(/\s+/g,""):raw.replace(/[\s,]/g,"");
  const n=Number(raw);
  return Number.isFinite(n)&&n>0?n:null;
}

function productId(url:string){
  return (url.match(/-(\d+)\.html(?:$|[?#])/i)||[])[1]||null;
}

function titleFromUrl(url:string){
  const m=url.match(/jumia\.com\.gh\/([^/?#]+?)-(\d+)\.html/i);
  return m?clean(m[1].replace(/[-_]+/g," ").replace(/\b\w/g,(x:string)=>x.toUpperCase())):"";
}

function slugify(s:string){
  return s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,90)||"jumia-product";
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
  return /^https?:\/\//i.test(x)
    && /(?:^|\.)jumia\.(?:is|com\.gh)\//i.test(x)
    && /(?:\.(?:jpg|jpeg|png|webp)(?:[?#]|$)|\/unsafe\/|\/product\/|\/cms\/external\/pet\/)/i.test(x)
    && !/(?:favicon|logo|sprite|icon|placeholder)/i.test(x);
}

function extractImages(source:string){
  const out:string[]=[];
  const add=(v:string)=>{
    const x=clean(v).replace(/\\/g,"").replace(/\\\//g,"/").replace(/[),]+$/g,"");
    if(isJumiaImage(x)&&!out.includes(x))out.push(x);
  };

  const md=/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/gi;
  let m:RegExpExecArray|null;
  while((m=md.exec(source))!==null){add(m[1]);if(out.length>=30)return out;}

  const attr=/\b(?:src|data-src|data-original|data-image|data-lazy-src|data-original-src|content)=["']([^"']+)["']/gi;
  while((m=attr.exec(source))!==null){
    m[1].split(/\s+/).forEach(add);
    if(out.length>=30)return out;
  }

  const urls=source.replace(/\\\//g,"/").match(/https?:\/\/[^\s"'<>]+/gi)||[];
  for(const u of urls){add(u);if(out.length>=30)break;}
  return out;
}

function extractPrice(source:string){
  const candidates=[
    meta(source,"product:price:amount"),
    meta(source,"og:price:amount"),
    meta(source,"price"),
    ...(source.match(/(?:GH₵|GHS|GHC|GH\s*₵|₵)\s*[0-9][0-9,\s]*(?:\.[0-9]{1,2})?/gi)||[]),
    ...(source.match(/(?:price|sale price|current price)\s*[:\-]?\s*(?:GH₵|GHS|GHC|GH\s*₵|₵)?\s*[0-9][0-9,\s]*(?:\.[0-9]{1,2})?/gi)||[])
  ];
  for(const x of candidates){const n=num(x);if(n!=null)return n;}
  return null;
}

function readerData(text:string,url:string){
  const title=(text.match(/^#\s+(.+)$/m)
    ||text.match(/^(?:Title|Product name)\s*:\s*(.+)$/im)
    ||text.match(/^\s*\*\*([^*]+)\*\*\s*$/m)||[])[1]||"";
  const links=text.match(/https?:\/\/(?:www\.)?jumia\.com\.gh\/[^\s)<>"']+/gi)||[];
  const id=productId(url);
  const canonical=links.find(x=>!id||x.includes(id))||url;
  const ratingMatch=text.match(/([0-5](?:\.\d)?)\s*(?:out of 5|\/5)/i);
  const reviewMatch=text.match(/([0-9][0-9,]*)\s*(?:ratings?|reviews?)/i);
  return {
    title:clean(title),
    images:extractImages(text),
    price:extractPrice(text),
    rating:num(ratingMatch?.[1]),
    reviewCount:Number(String(reviewMatch?.[1]||"0").replace(/,/g,""))||0,
    description:clean(text.replace(/^#.*$/m,"").split("\n\n").find(x=>x.trim())||""),
    url:canonical
  };
}

async function fetchText(url:string,headers:Record<string,string>={}){
  try{
    const r=await fetch(url,{headers,cache:"no-store",redirect:"follow"});
    const text=r.ok?await r.text():"";
    return {status:r.status,text:text.length>150?text:""};
  }catch{return {status:0,text:""};}
}

async function jinaReader(url:string){
  return fetchText("https://r.jina.ai/"+url,{
    "Accept":"text/plain,text/markdown,*/*",
    "User-Agent":"Mozilla/5.0",
    "X-Engine":"browser",
    "X-Proxy":"gh",
    "X-No-Cache":"true",
    "X-Timeout":"30",
    "X-User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36"
  });
}


async function microlinkFetch(url:string){
  try{
    const api="https://api.microlink.io/?url="+encodeURIComponent(url)
      +"&meta=true&prerender=true&waitForTimeout=4000&data.html.attr=html";
    const r=await fetch(api,{headers:{"Accept":"application/json","User-Agent":"Mozilla/5.0 Myshop Jumia importer"},cache:"no-store"});
    if(!r.ok)return null;
    const j=await r.json();
    if(j?.status!=="success")return null;
    const d=j.data||{};
    const rendered=typeof d.html==="string"?d.html:"";
    const image=typeof d.image==="string"?d.image:d.image?.url||"";
    const source=rendered+"\n"+(typeof d.markdown==="string"?d.markdown:"")+"\n"+JSON.stringify(d);
    const p=findProduct(jsonLd(rendered));
    const offers=Array.isArray(p?.offers)?p.offers[0]:p?.offers;
    const images=imageValues(p?.image).concat(image,extractImages(source)).filter(isJumiaImage);
    const price=num(offers?.price)??extractPrice(source);
    return {
      html:rendered,
      title:clean(p?.name||d.title||""),
      images:Array.from(new Set(images)),
      price,
      rating:num(p?.aggregateRating?.ratingValue),
      reviewCount:Number(p?.aggregateRating?.reviewCount||0)||0,
      description:clean(p?.description||d.description||""),
      product:p
    };
  }catch{return null;}
}

async function jinaSearch(q:string){
  return fetchText("https://s.jina.ai/?q="+encodeURIComponent(q),{
    "Accept":"text/plain,text/markdown,*/*",
    "User-Agent":"Mozilla/5.0",
    "X-Engine":"browser",
    "X-Proxy":"gh",
    "X-No-Cache":"true",
    "X-Timeout":"30"
  });
}

async function catalogFallback(url:string,id:string){
  const q=titleFromUrl(url).replace(/[-_]+/g," ").trim();
  if(!q)return null;

  const exact=await jinaSearch("site:jumia.com.gh "+id+" "+q);
  if(exact.text){
    const d=readerData(exact.text,url);
    if(d.price!=null&&d.images.length)return d;
  }

  const catalog=await jinaReader("https://www.jumia.com.gh/catalog/?q="+encodeURIComponent(q));
  if(catalog.text){
    const d=readerData(catalog.text,url);
    if(id&&catalog.text.includes(id)&&d.images.length&&d.price!=null)return d;
  }
  return null;
}

export async function POST(req:NextRequest){
  const s=await createClient();
  const {data:u}=await s.auth.getUser();
  if(!u.user)return NextResponse.json({error:"Authentication required"},{status:401});
  const {data:profile}=await s.from("profiles").select("role").eq("id",u.user.id).maybeSingle();
  if(profile?.role!=="ADMIN")return NextResponse.json({error:"Admin access required"},{status:403});

  const body=await req.json();
  const input=typeof body?.url==="string"?body.url.trim():"";
  const normalized=input.replace(/^http:\/\//i,"https://")
    .replace(/^https:\/\/(?!www\.)jumia\.com\.gh\//i,"https://www.jumia.com.gh/");

  if(!/^https:\/\/www\.jumia\.com\.gh\/[^?#]+-\d+\.html(?:[?#].*)?$/i.test(normalized)){
    return NextResponse.json({error:"Paste a Jumia Ghana product URL."},{status:400});
  }

  const id=productId(normalized);
  let directStatus=0;
  let html="";
  let product:any=null;
  let fallback:any={};

  const direct=await fetchText(normalized,{
    "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
    "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language":"en-US,en;q=0.9",
    "Referer":"https://www.google.com/"
  });
  directStatus=direct.status;

  if(direct.text){
    html=direct.text;
    product=findProduct(jsonLd(html));
    const offers=Array.isArray(product?.offers)?product.offers[0]:product?.offers;
    fallback={
      title:clean(product?.name||meta(html,"og:title")||meta(html,"twitter:title")),
      images:imageValues(product?.image).concat([meta(html,"og:image"),meta(html,"twitter:image")],extractImages(html)).filter(isJumiaImage),
      price:num(offers?.price)??extractPrice(html),
      rating:num(product?.aggregateRating?.ratingValue),
      reviewCount:Number(product?.aggregateRating?.reviewCount||0)||0,
      description:clean(product?.description||meta(html,"description"))
    };
  }

  // Known-good path from the earlier importer: Jina Reader, both URL forms.
  if(!product?.name||!fallback.images?.length||fallback.price==null){
    const readers=[
      normalized,
      "http://www.jumia.com.gh/"+normalized.split("/").slice(3).join("/")
    ];
    for(const target of readers){
      const r=await jinaReader(target);
      if(!r.text)continue;
      const d=readerData(r.text,normalized);
      fallback={
        ...fallback,
        title:fallback.title||d.title,
        images:[...(fallback.images||[]),...d.images],
        price:fallback.price??d.price,
        rating:fallback.rating??d.rating,
        reviewCount:fallback.reviewCount||d.reviewCount,
        description:fallback.description||d.description,
        url:fallback.url||d.url
      };
      if(fallback.images?.length&&fallback.price!=null)break;
    }
  }

  // Microlink uses a real browser and is kept before search/catalogue fallbacks.
  if(!fallback.images?.length||fallback.price==null){
    const m=await microlinkFetch(normalized);
    if(m){
      product=product||m.product;
      if(m.html)html=html||m.html;
      fallback={
        ...fallback,
        title:fallback.title||m.title,
        images:[...(fallback.images||[]),...m.images],
        price:fallback.price??m.price,
        rating:fallback.rating??m.rating,
        reviewCount:fallback.reviewCount||m.reviewCount,
        description:fallback.description||m.description
      };
    }
  }

  // Exact product-id search, then catalogue.
  if(!fallback.images?.length||fallback.price==null){
    const d=await catalogFallback(normalized,id||"");
    if(d){
      fallback={
        ...fallback,
        title:fallback.title||d.title,
        images:[...(fallback.images||[]),...d.images],
        price:fallback.price??d.price,
        rating:fallback.rating??d.rating,
        reviewCount:fallback.reviewCount||d.reviewCount,
        description:fallback.description||d.description,
        url:fallback.url||d.url
      };
    }
  }

  // Google through Jina, restricted to the exact Jumia product id.
  if(!fallback.images?.length||fallback.price==null){
    const q=encodeURIComponent((id||"")+" Jumia Ghana "+titleFromUrl(normalized));
    const r=await jinaReader("https://www.google.com/search?q="+q);
    if(r.text&&(!id||r.text.includes(id))){
      const d=readerData(r.text,normalized);
      fallback={
        ...fallback,
        title:fallback.title||d.title,
        images:[...(fallback.images||[]),...d.images],
        price:fallback.price??d.price,
        rating:fallback.rating??d.rating,
        reviewCount:fallback.reviewCount||d.reviewCount,
        description:fallback.description||d.description,
        url:fallback.url||d.url
      };
    }
  }

  // Google Translate copy of the exact page.
  if(!fallback.images?.length||fallback.price==null){
    const translated="https://www-jumia-com-gh.translate.goog/"
      +normalized.split("/").slice(3).join("/")
      +"?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=en";
    const r=await fetchText(translated,{
      "User-Agent":"Mozilla/5.0",
      "Accept":"text/html,application/xhtml+xml,*/*;q=0.8"
    });
    if(r.text){
      if(!html)html=r.text;
      const p=findProduct(jsonLd(r.text));
      const offers=Array.isArray(p?.offers)?p.offers[0]:p?.offers;
      const d=readerData(r.text,normalized);
      product=product||p;
      fallback={
        ...fallback,
        title:fallback.title||p?.name||d.title||meta(r.text,"og:title"),
        images:[...(fallback.images||[]),...imageValues(p?.image),...d.images,meta(r.text,"og:image")].filter(isJumiaImage),
        price:fallback.price??num(offers?.price)??d.price??extractPrice(r.text),
        rating:fallback.rating??num(p?.aggregateRating?.ratingValue)??d.rating,
        reviewCount:fallback.reviewCount||Number(p?.aggregateRating?.reviewCount||d.reviewCount||0)||0,
        description:fallback.description||clean(p?.description||meta(r.text,"description")||d.description),
        url:fallback.url||d.url
      };
    }
  }

  const rawTitle=clean(product?.name||fallback.title||meta(html,"og:title")||meta(html,"twitter:title")||titleFromUrl(normalized));
  const title=/^(search results|search|jumia)$/i.test(rawTitle)||/^search results\s*[-|]/i.test(rawTitle)?"":rawTitle;

  const offers=Array.isArray(product?.offers)?product.offers[0]:product?.offers;
  const images=imageValues(product?.image)
    .concat(fallback.images||[],meta(html,"og:image"),meta(html,"twitter:image"),extractImages(html))
    .map(clean).filter(isJumiaImage).filter((x,i,a)=>a.indexOf(x)===i);

  const price=num(offers?.price)
    ??num(offers?.lowPrice)
    ??num(product?.price)
    ??fallback.price
    ??extractPrice(html);

  if(!title||!images.length||price==null){
    const missing=[!title?"title":null,!images.length?"image":null,price==null?"price":null].filter(Boolean);
    const details=directStatus===403||directStatus===429
      ?"Jumia blocked the direct Render request; the importer also tried the previous working public fallbacks."
      :directStatus===404
        ?"Jumia returned 404 for this product."
        :"The page was reached, but the required product fields could not be verified.";
    return NextResponse.json({error:"Could not import this Jumia product.",details,missing,product_id:id},{status:422});
  }

  const canonical=clean(product?.url||meta(html,"og:url")||fallback.url||normalized.split("?")[0]);
  const canonicalId=productId(canonical)||id;
  const rating=product?.aggregateRating;
  const features=arr(product?.additionalProperty)
    .map((x:any)=>({name:clean(x?.name),value:clean(x?.value)}))
    .filter((x:any)=>x.name||x.value);
  const specifications:Record<string,string>={};
  for(const x of features)if(x.name)specifications[x.name]=x.value;

  const payload={
    jumia_product_id:canonicalId,
    source_url:canonical,
    title,
    slug:slugify(title)+"-"+canonicalId,
    description:clean(product?.description||fallback.description||meta(html,"description")),
    brand:typeof product?.brand==="object"?product.brand?.name:product?.brand||null,
    sku:product?.sku||null,
    price,
    compare_price:null,
    currency:offers?.priceCurrency||"GHS",
    discount_percent:null,
    rating:num(rating?.ratingValue)??fallback.rating??null,
    review_count:Number(rating?.reviewCount||rating?.ratingCount||fallback.reviewCount||0)||0,
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

  const existing=await s.from("jumia_products").select("id").eq("source_url",canonical).maybeSingle();
  const q=existing.data
    ?await s.from("jumia_products").update(payload).eq("id",existing.data.id).select("*").single()
    :await s.from("jumia_products").insert(payload).select("*").single();

  if(q.error)return NextResponse.json({error:q.error.message},{status:400});
  return NextResponse.json({product:q.data,source:"url-fallback"});
}
