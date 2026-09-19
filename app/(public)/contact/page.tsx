"use client";

import {FormEvent,useState} from "react";
import LegalPage from "../../../components/LegalPage";

export default function Contact(){
  const [status,setStatus]=useState("");
  const [busy,setBusy]=useState(false);

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    const accessKey=process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;
    if(!accessKey){setStatus("Contact form is not configured yet.");return;}
    setBusy(true);setStatus("");
    const form=new FormData(e.currentTarget);
    form.set("access_key",accessKey);
    form.set("subject","New Myshop customer support message");
    form.set("from_name","Myshop Support");
    form.set("botcheck","");
    try{
      const response=await fetch("https://api.web3forms.com/submit",{method:"POST",body:form});
      const result=await response.json().catch(()=>null);
      if(response.ok&&result?.success){e.currentTarget.reset();setStatus("Your message has been sent successfully. We will review it and respond using the email you provided.");}
      else setStatus(result?.message||"We could not send your message. Please try again.");
    }catch{setStatus("We could not send your message. Please check your connection and try again.");}
    finally{setBusy(false);}
  }

  return <LegalPage title="Contact Myshop" intro="Use the form below for order questions, account help, payment issues, privacy requests, returns, delivery problems and security reports." updated="19 September 2026" sections={[
    {title:"Customer support",body:<><p>Send your request through the support form below. Include your account email and order number when your request concerns an order. Do not send passwords, one-time passwords, card PINs or complete payment-card numbers.</p><form onSubmit={submit} style={{display:"grid",gap:12,marginTop:18}}>
      <input name="name" required placeholder="Full name" style={fieldStyle}/>
      <input name="email" type="email" required placeholder="Email address" style={fieldStyle}/>
      <input name="phone" placeholder="Phone number" style={fieldStyle}/>
      <input name="order_number" placeholder="Order number (if applicable)" style={fieldStyle}/>
      <select name="topic" defaultValue="Order support" style={fieldStyle}><option>Order support</option><option>Payment problem</option><option>Delivery problem</option><option>Return or refund</option><option>Account help</option><option>Privacy or data request</option><option>Security report</option><option>Other</option></select>
      <textarea name="message" required rows={7} placeholder="Describe your request clearly, including what happened and what you need help with." style={{...fieldStyle,resize:"vertical"}}/>
      <label style={{display:"flex",gap:8,alignItems:"center",fontSize:13}}><input type="checkbox" name="consent" required/> I confirm that the information above is accurate and does not contain passwords, OTPs, PINs or full card details.</label>
      <button type="submit" disabled={busy} style={buttonStyle}>{busy?"Sending...":"Send message"}</button>
      {status&&<p role="status" style={{fontSize:13,lineHeight:1.6,color:status.startsWith("Your message")?"#166534":"#b45309"}}>{status}</p>}
    </form></>},
    {title:"Payment problems",body:<p>If money was debited but an order was not created, do not immediately pay again. Keep the Paystack transaction reference and submit it through the form so the transaction can be verified and reconciled.</p>},
    {title:"Delivery problems",body:<p>For a late, missing, damaged or incorrect delivery, provide the order number, delivery details, date received or expected, and relevant photos or evidence.</p>},
    {title:"Privacy and data requests",body:<p>For access, correction, deletion or privacy questions, identify the account email and describe the request. Never send your password, OTP, PIN or full card details.</p>},
    {title:"Security reports",body:<p>If you discover a security vulnerability, avoid accessing other users' data or causing damage. Report the affected page, steps to reproduce and relevant timestamps so the issue can be investigated responsibly.</p>}
  ]}/>;
}

const fieldStyle={width:"100%",border:"1px solid #ddd",borderRadius:12,padding:"12px 13px",fontSize:14,background:"#fff",outline:"none"} as const;
const buttonStyle={border:0,borderRadius:12,padding:"13px 18px",fontWeight:800,color:"#fff",background:"#f68b1e",cursor:"pointer"} as const;
