"use client";
import { useEffect } from "react";
import { createClient } from "../lib/supabase/client";

export default function RecommendationTracker({productId,query}:{productId?:string;query?:string}){
  useEffect(()=>{
    const key="myshop_behavior";
    let old:{views:string[];searches:string[]}={views:[],searches:[]};
    try{old={...old,...JSON.parse(localStorage.getItem(key)||"{}")}}catch{}
    if(productId) old.views=[productId,...old.views.filter(x=>x!==productId)].slice(0,30);
    if(query?.trim()) old.searches=[query.trim(),...old.searches.filter(x=>x!==query.trim())].slice(0,30);
    localStorage.setItem(key,JSON.stringify(old));
    const s=createClient();
    void (async()=>{
      const {data:{user}}=await s.auth.getUser();
      if(!user)return;
      if(productId){
        const {error}=await s.from("product_views").insert({user_id:user.id,product_id:productId});
        if(error) console.warn("product view tracking failed",error.message);
      }
      if(query?.trim()) void s.from("user_searches").insert({user_id:user.id,query:query.trim()});
    })();
  },[productId,query]);
  return null;
}