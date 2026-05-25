import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Item } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const { data: items, error } = await supabase
    .from("items")
    .select("*")
    .order("creado_en", { ascending: false });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white mb-8 transition-colors"
        >
          ← Volver al hub
        </Link>

        <header className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">📦</span>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                Inventario
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              {items?.length ?? 0} {items?.length === 1 ? "item" : "items"} registrados
            </p>
          </div>

          <Link
            href="/inventario/nuevo"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition-colors"
          >
            + Añadir item
          </Link>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
            Error al cargar: {error.message}
          </div>
        )}

        {!error && items && items.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow-md text-center">
            <p className="text-6xl mb-4">📭</p>
            <p className="text-slate-500 dark:text-slate-400 text-lg mb-4">
              Aún no tienes items registrados
            </p>
            <Link
              href="/inventario/nuevo"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors"
            >
              Crear el primero
            </Link>
          </div>
        )}

        {!error && items && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item: Item) => (
              <Link
                key={item.id}
                href={`/inventario/${item.id}`}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                    {item.nombre}
                  </h3>
                  <span
                    className={`text-sm font-bold px-2.5 py-1 rounded-lg ${
                      item.cantidad === 0
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        : item.cantidad < 5
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    }`}
                  >
                    {item.cantidad}
                  </span>
                </div>
                {item.descripcion && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                    {item.descripcion}
                  </p>
                )}
                {item.categoria && (
                  <span className="inline-block text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                    {item.categoria}
                  </span>
                )}
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 font-mono">
                  {item.codigo_barras}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}