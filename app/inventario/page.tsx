"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Item } from "@/lib/types";

export default function InventarioPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("__todas__");
  const [busqueda, setBusqueda] = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data, error: dbError } = await supabase
      .from("items")
      .select("*")
      .order("creado_en", { ascending: false });

    if (dbError) {
      setError(dbError.message);
    } else {
      setError(null);
      setItems((data ?? []) as Item[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        cargar();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [cargar]);

  const categorias = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => {
      if (it.categoria && it.categoria.trim()) set.add(it.categoria);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [items]);

  const itemsFiltrados = useMemo(() => {
    return items.filter((it) => {
      if (categoriaSeleccionada === "__sin__") {
        if (it.categoria && it.categoria.trim()) return false;
      } else if (categoriaSeleccionada !== "__todas__") {
        if (it.categoria !== categoriaSeleccionada) return false;
      }
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const enNombre = it.nombre.toLowerCase().includes(q);
        const enDesc = (it.descripcion ?? "").toLowerCase().includes(q);
        const enCodigo = it.codigo_barras.toLowerCase().includes(q);
        if (!enNombre && !enDesc && !enCodigo) return false;
      }
      return true;
    });
  }, [items, categoriaSeleccionada, busqueda]);

  const hayItemsSinCategoria = items.some(
    (it) => !it.categoria || !it.categoria.trim()
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white mb-8 transition-colors">
          ← Volver al hub
        </Link>

        <header className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">📦</span>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Inventario</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              {loading ? "Cargando..." : `${itemsFiltrados.length} de ${items.length} ${items.length === 1 ? "item" : "items"}`}
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/inventario/scan" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition-colors">
              📷 Escanear
            </Link>
            <Link href="/inventario/nuevo" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition-colors">
              + Añadir
            </Link>
          </div>
        </header>

        {items.length > 0 && (
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="🔍 Buscar por nombre, descripción o código..."
            className="w-full px-4 py-2.5 mb-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        )}

        {(categorias.length > 0 || hayItemsSinCategoria) && (
          <div className="flex flex-wrap gap-2 mb-6">
            <CategoriaChip label="Todas" activo={categoriaSeleccionada === "__todas__"} onClick={() => setCategoriaSeleccionada("__todas__")} count={items.length} />
            {categorias.map((cat) => (
              <CategoriaChip key={cat} label={cat} activo={categoriaSeleccionada === cat} onClick={() => setCategoriaSeleccionada(cat)} count={items.filter((it) => it.categoria === cat).length} />
            ))}
            {hayItemsSinCategoria && (
              <CategoriaChip label="Sin categoría" activo={categoriaSeleccionada === "__sin__"} onClick={() => setCategoriaSeleccionada("__sin__")} count={items.filter((it) => !it.categoria || !it.categoria.trim()).length} />
            )}
          </div>
        )}

        {loading && <p className="text-slate-500 text-center py-12">Cargando...</p>}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">Error al cargar: {error}</div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow-md text-center">
            <p className="text-6xl mb-4">📭</p>
            <p className="text-slate-500 dark:text-slate-400 text-lg mb-4">Aún no tienes items registrados</p>
            <Link href="/inventario/nuevo" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors">
              Crear el primero
            </Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && itemsFiltrados.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow-md text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-slate-500 dark:text-slate-400">No hay items que coincidan con el filtro</p>
          </div>
        )}

        {!loading && !error && itemsFiltrados.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {itemsFiltrados.map((item) => (
              <a key={item.id} href={`/inventario/${item.id}`} className="block bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{item.nombre}</h3>
                  <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${item.cantidad === 0 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : item.cantidad < 5 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"}`}>
                    {item.cantidad}
                  </span>
                </div>
                {item.descripcion && <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">{item.descripcion}</p>}
                {item.categoria && <span className="inline-block text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">{item.categoria}</span>}
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 font-mono truncate">{item.codigo_barras}</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function CategoriaChip({ label, activo, onClick, count }: { label: string; activo: boolean; onClick: () => void; count: number; }) {
  return (
    <button onClick={onClick} type="button" className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${activo ? "bg-blue-600 border-blue-600 text-white shadow-sm" : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600"}`}>
      {label} <span className="opacity-70 ml-1">({count})</span>
    </button>
  );
}