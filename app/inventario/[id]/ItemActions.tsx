"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Item } from "@/lib/types";

export default function ItemActions({ item }: { item: Item }) {
  const router = useRouter();
  const [cantidad, setCantidad] = useState(item.cantidad);
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function actualizarCantidad(nuevaCantidad: number) {
    if (nuevaCantidad < 0) return;
    setError(null);
    setGuardando(true);
    const cantidadAnterior = cantidad;
    setCantidad(nuevaCantidad); // optimista: actualiza UI ya

    const { error: dbError } = await supabase
      .from("items")
      .update({
        cantidad: nuevaCantidad,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (dbError) {
      setError(dbError.message);
      setCantidad(cantidadAnterior); // revertir si falla
    } else {
      router.refresh(); // refresca metadatos
    }
    setGuardando(false);
  }

  async function borrarItem() {
    const ok = confirm(`¿Borrar "${item.nombre}"? Esta acción no se puede deshacer.`);
    if (!ok) return;
    setBorrando(true);

    const { error: dbError } = await supabase
      .from("items")
      .delete()
      .eq("id", item.id);

    if (dbError) {
      setError(dbError.message);
      setBorrando(false);
      return;
    }

    router.push("/inventario");
  }

  const colorCantidad =
    cantidad === 0
      ? "text-red-600 dark:text-red-400"
      : cantidad < 5
      ? "text-amber-600 dark:text-amber-400"
      : "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="p-6">
      {/* Display gigante de cantidad */}
      <div className="text-center mb-6">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
          Cantidad actual
        </p>
        <p className={`text-7xl font-bold ${colorCantidad}`}>{cantidad}</p>
      </div>

      {/* Botones +/- */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => actualizarCantidad(cantidad - 1)}
          disabled={guardando || cantidad === 0}
          className="bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 disabled:opacity-40 text-red-700 dark:text-red-300 font-bold text-2xl py-4 rounded-xl transition-colors"
        >
          − 1
        </button>
        <button
          onClick={() => actualizarCantidad(cantidad + 1)}
          disabled={guardando}
          className="bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 disabled:opacity-40 text-emerald-700 dark:text-emerald-300 font-bold text-2xl py-4 rounded-xl transition-colors"
        >
          + 1
        </button>
      </div>

      {/* Campo numérico para edición exacta */}
      <div className="flex gap-2 mb-4">
        <input
          type="number"
          min={0}
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value))}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center font-medium"
        />
        <button
          onClick={() => actualizarCantidad(cantidad)}
          disabled={guardando}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          {guardando ? "..." : "Guardar"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      {/* Borrar */}
      <button
        onClick={borrarItem}
        disabled={borrando}
        className="w-full mt-4 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 py-2 transition-colors"
      >
        {borrando ? "Borrando..." : "🗑️ Borrar item"}
      </button>
    </div>
  );
}