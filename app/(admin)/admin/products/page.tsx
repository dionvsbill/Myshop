import Link from "next/link";
import { createClient } from "../../../../lib/supabase/server";

export default async function AdminProducts() {
  const s = await createClient();

  const { data, error } = await s
    .from("products")
    .select("id,title,price,stock,is_active,categories(name)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Products</h2>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-slate-950 px-4 py-2 text-sm text-white"
        >
          Add product
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="p-4">Title</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Category</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((p) => {
              const category = Array.isArray(p.categories)
                ? p.categories[0]
                : p.categories;

              return (
                <tr key={p.id} className="border-b">
                  <td className="p-4">
                    <Link
                      className="font-medium hover:underline"
                      href={"/admin/products/" + p.id}
                    >
                      {p.title}
                    </Link>
                  </td>
                  <td>GHS {Number(p.price).toFixed(2)}</td>
                  <td>{p.stock}</td>
                  <td>{category?.name || "—"}</td>
                  <td>{p.is_active ? "Yes" : "No"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
