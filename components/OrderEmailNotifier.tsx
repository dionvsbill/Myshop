"use client";

import {useEffect,useRef} from "react";
import {createClient} from "../lib/supabase/client";

type Props={orderId?:string};

export default function OrderEmailNotifier({orderId}:Props){
  const sent=useRef(false);

  useEffect(()=>{
    if(!orderId||sent.current)return;
    const key=process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;
    if(!key)return;
    const storageKey="myshop-order-email-"+orderId;
    if(sessionStorage.getItem(storageKey)==="sent")return;
    sent.current=true;

    (async()=>{
      const supabase=createClient();
      const [{data:userResult},{data:order}] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("orders").select("id,order_number,status,total,currency,payment_reference,created_at,shipping_address,items").eq("id",orderId).maybeSingle()
      ]);
      if(!userResult.user||!order){sent.current=false;return;}

      const storedItems=Array.isArray(order.items)?order.items:[];
      const items=storedItems.map((item:any)=>
        (item.title||"Product")+
        (item.variant_title?" — "+item.variant_title:"")+
        " × "+(item.quantity||0)+" @ "+(order.currency||"GHS")+" "+Number(item.unit_price??item.price??0).toFixed(2)
      ).join("\n");

      const shipping=order.shipping_address||{};
      const message=[
        "A new Myshop order has been paid and created.",
        "",
        "Order: "+(order.order_number||order.id),
        "Customer: "+(userResult.user.email||"Unknown"),
        "Status: "+order.status,
        "Payment reference: "+(order.payment_reference||"N/A"),
        "Total: "+(order.currency||"GHS")+" "+Number(order.total||0).toFixed(2),
        "Created: "+new Date(order.created_at).toLocaleString("en-GH",{timeZone:"Africa/Accra"}),
        "",
        "Items:",
        items||"No item details available",
        "",
        "Delivery details:",
        "Name: "+(shipping.full_name||""),
        "Phone: "+(shipping.phone||""),
        "Address: "+(shipping.address||""),
        "City: "+(shipping.city||""),
        "Region: "+(shipping.region||"")
      ].join("\n");

      try{
        const response=await fetch("https://api.web3forms.com/submit",{
          method:"POST",
          headers:{"Content-Type":"application/json","Accept":"application/json"},
          body:JSON.stringify({
            access_key:key,
            subject:"New Myshop order — "+(order.order_number||order.id),
            from_name:"Myshop Orders",
            email:userResult.user.email||"",
            message,
            botcheck:""
          })
        });
        const result=await response.json().catch(()=>null);
        if(response.ok&&result?.success)sessionStorage.setItem(storageKey,"sent");
        else sent.current=false;
      }catch{sent.current=false;}
    })();
  },[orderId]);

  return null;
}
