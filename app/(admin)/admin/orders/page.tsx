import { createClient } from "../../../../lib/supabase/server";

export default async function Orders() {
  const s = await createClient();

  const { data, error } = await s
    .from("orders")
    .select(
      "id,order_number,total,status,created_at,profiles(email,full_name)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load orders: ${error.message}`);
  }

  return (
    <section>
      <h2 className="text-2xl font-bold">Orders</h2>
      <div className="mt-6 overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="p-4">Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((o) => {
              const profile = Array.isArray(o.profiles)
                ? o.profiles[0]
                : o.profiles;

              return (
                <tr key={o.id} className="border-b">
                  <td className="p-4 font-medium">{o.order_number}</td>
                  <td>
                    {profile?.full_name || profile?.email || "—"}
                  </td>
                  <td>GHS {Number(o.total).toFixed(2)}</td>
                  <td>{o.status}</td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
