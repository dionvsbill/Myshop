export type RecommendationProduct={id:string;slug:string;title:string;price:number;compare_price?:number|null;images?:string[];rating?:number|null;review_count?:number|null;stock?:number|null;category_id?:string|null;brand?:string|null;tags?:string[]|null;created_at?:string};

type Behavior={views?:string[];searches?:string[]};

const hash=(value:string)=>{let h=2166136261;for(let i=0;i<value.length;i++)h=Math.imul(h^value.charCodeAt(i),16777619);return (h>>>0)/4294967295};
const tokens=(s:string)=>s.toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2);

export function recommendProducts(products:RecommendationProduct[], behavior:Behavior={}, options:{currentId?:string;categoryId?:string;brand?:string;limit?:number}={}){
 const now=Date.now(); const views=new Set(behavior.views||[]); const searches=(behavior.searches||[]).flatMap(tokens); const limit=options.limit??12;
 const scored=products.filter(p=>p.id!==options.currentId&&Number(p.stock??1)>0).map(p=>{
  const text=tokens([p.title,p.brand||"",...(p.tags||[])].join(" ")); const searchHits=searches.reduce((n,t)=>n+(text.includes(t)?1:0),0);
  const viewed=views.has(p.id)?-3:0; const category=p.category_id&&options.categoryId&&p.category_id===options.categoryId?5:0; const brand=p.brand&&options.brand&&p.brand.toLowerCase()===options.brand.toLowerCase()?3:0;
  const rating=Math.min(Number(p.rating||0),5)*1.1; const popularity=Math.log1p(Number(p.review_count||0))*0.45; const discount=p.compare_price&&Number(p.compare_price)>Number(p.price)?Math.min(4,(1-Number(p.price)/Number(p.compare_price))*8):0;
  const age=p.created_at?Math.max(0,1-(now-new Date(p.created_at).getTime())/(1000*60*60*24*180)):0; const novelty=age*2;
  const jitter=hash((p.id)+":"+Math.floor(now/(1000*60*30)))*1.8;
  return {p,score:searchHits*4+category+brand+rating+popularity+discount+novelty+viewed+jitter};
 }).sort((a,b)=>b.score-a.score);
 const out:RecommendationProduct[]=[]; const used=new Set<string>();
 for(const item of scored){if(used.has(item.p.id))continue;used.add(item.p.id);out.push(item.p);if(out.length>=limit)break;}
 return out;
}

export function diversifyProducts(products:RecommendationProduct[],limit=12){return recommendProducts(products,{}, {limit});}
