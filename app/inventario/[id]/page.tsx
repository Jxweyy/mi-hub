import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Item } from "@/lib/types";
import ItemActions from "./ItemActions";
import CodigoBarras from "./CodigoBarras";

export const dynamic = "force-dynamic";

export default async function ItemDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: item, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !item) {
    notFound();
  }

  const itemTyped = item as Item;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 print:bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link
          href="/inventario"
          className="inline-flex items-center text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white mb-8 transition-colors print:hidden"
        >
          ← Volver al inventario
        </Link>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md overflow-hidden mb-6">
          {/* Cabecera */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {itemTyped.nombre}
            </h1>
            {itemTyped.categoria && (
              <span className="inline-block text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                {itemTyped.categoria}
              </span>
            )}
            {itemTyped.descripcion && (
              <p className="text-slate-600 dark:text-slate-300 mt-3">
                {itemTyped.descripcion}
              </p>
            )}
          </div>

          {/* Acciones (cantidad, +/-, borrar) */}
          <div className="print:hidden">
            <ItemActions item={itemTyped} />
          </div>

          {/* Metadatos */}
          <div className="p-6 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500 space-y-1 print:hidden">
            <p className="font-mono">Código: {itemTyped.codigo_barras}</p>
            <p>Creado: {new Date(itemTyped.creado_en).toLocaleString("es-ES")}</p>
            <p>Última edición: {new Date(itemTyped.actualizado_en).toLocaleString("es-ES")}</p>
          </div>
        </div>

        {/* Código de barras */}
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wide print:hidden">
          Código de barras
        </h2>
        <CodigoBarras codigo={itemTyped.codigo_barras} />
      </div>
    </main>
  );
}