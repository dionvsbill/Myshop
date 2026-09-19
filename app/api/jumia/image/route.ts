import {NextRequest,NextResponse} from "next/server";

export async function GET(req:NextRequest){
  const raw=req.nextUrl.searchParams.get("url")||"";
  let url="";
  try{url=new URL(raw).toString()}catch{return new NextResponse("Invalid image URL",{status:400})}
  if(!/^(https?:\/\/)([^/]*\.)?(jumia\.is|jumia\.com\.gh)(\/|$)/i.test(url))return new NextResponse("Image host not allowed",{status:403});
  try{
    const res=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 (compatible; Myshop/1.0)","Accept":"image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"},cache:"no-store"});
    if(!res.ok)return new NextResponse("Image unavailable",{status:res.status});
    const type=res.headers.get("content-type")||"image/jpeg";
    if(!type.startsWith("image/"))return new NextResponse("Not an image",{status:415});
    return new NextResponse(await res.arrayBuffer(),{status:200,headers:{"Content-Type":type,"Cache-Control":"public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400"}});
  }catch{return new NextResponse("Image fetch failed",{status:502})}
}
