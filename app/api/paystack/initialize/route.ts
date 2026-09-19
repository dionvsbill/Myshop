import {NextResponse} from "next/server";import {createClient} from "../../../../lib/supabase/server";import {createClient as createAdminClient} from "@supabase/supabase-js";
export async function POST(req:Request){
 try{
  const s=await createClient();const{data:{user}}=await s.auth.getUser();if(!user)return NextResponse.json({error:"Not authenticated"},{status:401});
  const body=await req.json();
  const{data:items,error}=await s.from("cart_items").select("id,quantity,product_id,variant_id,products(title,price,stock,is_active),product_variants(title,price,stock,is_active)").eq("user_id",user.id);
  if(error)throw error;if(!items?.length)return NextResponse.json({error:"Your cart is empty."},{status:400});
  const unavailable=(items as any[]).filter(i=>{const v=i.product_variants;const p=i.products;const stock=Number(v?.stock??p?.stock??0);return !p?.is_active|| (v&&v.is_active===false)||Number(i.quantity)>stock||stock<=0});
  if(unavailable.length){
    const names=unavailable.map(i=>i.products?.title||"Product").join(", ");
    return NextResponse.json({error:"Stock changed before payment. Please update your cart before paying.",items:unavailable.map(i=>({id:i.id,title:i.products?.title,requested:Number(i.quantity),available:Number(i.product_variants?.stock??i.products?.stock??0)})),message:"Unavailable: "+names},{status:409});
  }
  const total=(items as any[]).reduce((n,i)=>n+Number(i.product_variants?.price??i.products?.price??0)*Number(i.quantity),0);
  if(total<=0)return NextResponse.json({error:"Invalid order total."},{status:400});
  const secret=process.env.PAYSTACK_SECRET_KEY;if(!secret)return NextResponse.json({error:"Paystack is not configured on the server. Add PAYSTACK_SECRET_KEY in Render."},{status:503});
  const configured=process.env.NEXT_PUBLIC_SITE_URL||"";const base=/^https:\/\/myshop-egvq\.onrender\.com\/?$/i.test(configured)?configured.replace(/\/$/,""):"https://myshop-egvq.onrender.com";
  const response=await fetch("https://api.paystack.co/transaction/initialize",{method:"POST",headers:{Authorization:"Bearer "+secret,"Content-Type":"application/json"},body:JSON.stringify({email:user.email,amount:Math.round(total*100),currency:"GHS",callback_url:base+"/api/paystack/callback",metadata:{user_id:user.id,shipping:body.shipping||{}}})});
  const data=await response.json();if(!response.ok||!data.status)return NextResponse.json({error:data.message||"Paystack could not initialize the payment."},{status:400});
  const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY,url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  if(serviceKey&&url&&data.data?.reference){const admin=createAdminClient(url,serviceKey);await admin.from("payment_transactions").upsert({user_id:user.id,reference:data.data.reference,amount:total,currency:"GHS",status:"INITIALIZED",paystack_status:"ongoing",metadata:{shipping:body.shipping||{},cart:items.map((i:any)=>({cart_item_id:i.id,product_id:i.product_id,variant_id:i.variant_id,quantity:Number(i.quantity),unit_price:Number(i.product_variants?.price??i.products?.price??0)}))},initialized_at:new Date().toISOString()},{onConflict:"reference"});}
  return NextResponse.json(data.data)
 }catch(e:any){return NextResponse.json({error:e?.message||"Unable to initialize payment."},{status:500})}
}