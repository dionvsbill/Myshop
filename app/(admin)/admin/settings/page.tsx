import { Settings, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  return (
    <section className="max-w-4xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Configuration</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight">Settings</h1>
      <p className="mt-2 text-sm text-neutral-500">Store configuration and operational information.</p>
      <div className="mt-7 space-y-5">
        <div className="rounded-xl border bg-white p-6"><div className="flex gap-4"><div className="grid h-10 w-10 place-items-center rounded-lg bg-neutral-100"><Settings size={19}/></div><div><h2 className="font-bold">Store configuration</h2><p className="mt-2 text-sm leading-6 text-neutral-500">Payment providers, email delivery and operational integrations are configured through the deployment environment.</p></div></div></div>
        <div className="rounded-xl border bg-white p-6"><div className="flex gap-4"><div className="grid h-10 w-10 place-items-center rounded-lg bg-neutral-100"><ShieldCheck size={19}/></div><div><h2 className="font-bold">Security</h2><p className="mt-2 text-sm leading-6 text-neutral-500">Supabase authentication and row-level security protect customer and store data.</p></div></div></div>
      </div>
    </section>
  );
}
