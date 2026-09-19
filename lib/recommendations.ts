export type RecommendationProduct={id:string;slug:string;title:string;price:number;compare_price?:number|null;images?:string[];rating?:number|null;review_count?:number|null;stock?:number|null;category_id?:string|null;brand?:string|null;tags?:string[]|null;created_at?:string;is_featured?:boolean};
type Behavior={views?:string[];searches?:string[]};
const hash=(value:string)=>{let h=2166136261;for(let i=0;i<value.length;i++)h=Math.imul(h^value.charCodeAt(i),16777619);return(h>>>0)/4294967295};
const tokens=(s:string)=>s.toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2);
export function recommendProducts(products:RecommendationProduct[],behavior:Behavior={},options:{currentId?:string;categoryId?:string;brand?:string;limit?:number;excludeIds?:string[]}={}){
 const now=Date.now(),views=new Set(behavior.views||[]),searches=(behavior.searches||[]).flatMap(tokens),excluded=new Set(options.excludeIds||[]),limit=options.limit??12;
 return products.filter(p=>p.id!==options.currentId&&!excluded.has(p.id)&&Number(p.stock??1)>0).map(p=>{
  const text=tokens([p.title,p.brand||"",...(p.tags||[])].join(" ")),searchHits=searches.reduce((n,t)=>n+(text.includes(t)?1:0),0),category=p.category_id&&options.categoryId&&p.category_id===options.categoryId?5:0,brand=p.brand&&options.brand&&p.brand.toLowerCase()===options.brand.toLowerCase()?3:0;
  const rating=Math.min(Number(p.rating||0),5)*1.1,popularity=Math.log1p(Number(p.review_count||0))*.45,discount=p.compare_price&&Number(p.compare_price)>Number(p.price)?Math.min(4,(1-Number(p.price)/Number(p.compare_price))*8):0,age=p.created_at?Math.max(0,1-(now-new Date(p.created_at).getTime())/(1000*60*60*24*180)):0,novelty=age*2,viewPenalty=views.has(p.id)?-2.5:0,jitter=hash(p.id+":"+Math.floor(now/(1000*60*20)))*2.4;
  return{p,score:searchHits*6+category+brand+rating+popularity+discount+novelty+viewPenalty+jitter};
 }).sort((a,b)=>b.score-a.score).slice(0,limit).map(x=>x.p);
}
export function shuffleProducts(products:RecommendationProduct[],limit=12,seed=Date.now()){
 return [...products].sort((a,b)=>hash(a.id+":"+Math.floor(seed/(1000*60*20)))-hash(b.id+":"+Math.floor(seed/(1000*60*20)))).slice(0,limit);
}
