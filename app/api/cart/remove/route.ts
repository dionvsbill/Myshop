import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function POST(req:Request){
  const body=await req.json();
  const s=await createClient();
  const {data:u}=await s.auth.getUser();
  if(!u.user) return NextResponse.json({error:"Unauthorized"},{status:401});
  let del=s.from("cart_items").delete().eq("user_id",u.user.id).eq("product_id",body.product_id);
  del=body.variant_id ? del.eq("variant_id",body.variant_id) : del.is("variant_id",null);
  if(body.item_id) del=del.eq("id",body.item_id);
  const {error}=await del;
  if(error) return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({ok:true});
}