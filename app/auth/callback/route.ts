import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

function safeNext(value:string|null){
  if(!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export async function GET(req:Request){
  const url=new URL(req.url);
  const code=url.searchParams.get("code");
  const next=safeNext(url.searchParams.get("next"));
  const error=url.searchParams.get("error_description")||url.searchParams.get("error");
  if(error){
    return NextResponse.redirect(new URL("/auth/auth-code-error?message="+encodeURIComponent(error),req.url));
  }
  if(code){
    const s=await createClient();
    const {error:exchangeError}=await s.auth.exchangeCodeForSession(code);
    if(exchangeError){
      return NextResponse.redirect(new URL("/auth/auth-code-error?message="+encodeURIComponent(exchangeError.message),req.url));
    }
  }
  return NextResponse.redirect(new URL(next,req.url));
}