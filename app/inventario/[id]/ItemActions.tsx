"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Item } from "@/lib/types";

export default function ItemActions({ item }: { item: Item }) {
  const router = useRouter();

  // Estado de cantidad
  const [cantidad, setCantidad] = useState(item.cantidad);
  const [guardandoCantidad, setGuardandoCantidad] = useState(false);

  // Estado de edición de campos
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(item.nombre);
  const [descripcion, setDescripcion] = useState(item.descripcion ?? "");
  const [categoria, setCategoria] = useState(item.categoria ?? "");
  const [guardandoCampos, setGuardandoCampos] = useState(false);

  // Otros estados
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function actualizarCantidad(nuevaCantidad: number) {
    if (nuevaCantidad < 0) return;
    setError(null);
    setGuardandoCantidad(true);
    const cantidadAnterior = cantidad;
    setCantidad(nuevaCantidad);

    const { error: dbError } = await supabase
      .from("items")
      .update({
        cantidad: nuevaCantidad,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (dbError) {
      setError(dbError.message);
      setCantidad(cantidadAnterior);
    } else {
      router.refresh();
    }
    setGuardandoCantidad(false);
  }

  async function guardarCampos() {
    if (!nombre.trim()) {
      setError("El nombre no puede estar vacío.");
      return;
    }
    setError(null);
    setGuardandoCampos(true);

    const { error: dbError } = await supabase
      .from("items")
      .update({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        categoria: categoria.trim() || null,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (dbError) {
      setError(dbError.message);
      setGuardandoCampos(false);
      return;
    }

    setEditando(false);
    setGuardandoCampos(false);
    router.refresh();
  }

  function cancelarEdicion() {
    setNombre(item.nombre);
    setDescripcion(item.descripcion ?? "");
    setCategoria(item.categoria ?? "");
    setEditando(false);
    setError(null);
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
      {/* Bloque de edición de campos */}
      {editando ? (
        <div className="space-y-4 mb-6 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Categoría
            </label>
            <input
              type="text"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Ej: Electrónica"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={guardarCampos}
              disabled={guardandoCampos}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
            >
              {guardandoCampos ? "Guardando..." : "💾 Guardar cambios"}
            </button>
            <button
              onClick={cancelarEdicion}
              disabled={guardandoCampos}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEditando(true)}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4 inline-flex items-center gap-1 transition-colors"
        >
          ✏️ Editar nombre, descripción o categoría
        </button>
      )}

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
          disabled={guardandoCantidad || cantidad === 0}
          className="bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 disabled:opacity-40 text-red-700 dark:text-red-300 font-bold text-2xl py-4 rounded-xl transition-colors"
        >
          − 1
        </button>
        <button
          onClick={() => actualizarCantidad(cantidad + 1)}
          disabled={guardandoCantidad}
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
          disabled={guardandoCantidad}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          {guardandoCantidad ? "..." : "Guardar"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

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