"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  valor: string;
  onCambio: (nuevo: string) => void;
};

const NUEVA = "__nueva__";

export default function SelectorCategoria({ valor, onCambio }: Props) {
  const [categorias, setCategorias] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modoNueva, setModoNueva] = useState(false);

  // Cargar categorías existentes una sola vez
  useEffect(() => {
    async function cargar() {
      const { data } = await supabase
        .from("items")
        .select("categoria")
        .not("categoria", "is", null);

      const set = new Set<string>();
      data?.forEach((row: { categoria: string | null }) => {
        if (row.categoria && row.categoria.trim()) set.add(row.categoria.trim());
      });
      setCategorias(Array.from(set).sort((a, b) => a.localeCompare(b, "es")));
      setCargando(false);
    }
    cargar();
  }, []);

  // Si el valor inicial existe pero no está en la lista, lo añadimos
  const opciones = useMemo(() => {
    if (valor && !categorias.includes(valor)) {
      return [...categorias, valor].sort((a, b) => a.localeCompare(b, "es"));
    }
    return categorias;
  }, [categorias, valor]);

  // Si el valor está vacío al cargar y NO hay categorías existentes,
  // entramos directamente en modo "nueva"
  useEffect(() => {
    if (!cargando && opciones.length === 0 && !modoNueva) {
      setModoNueva(true);
    }
  }, [cargando, opciones.length, modoNueva]);

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    if (v === NUEVA) {
      setModoNueva(true);
      onCambio("");
    } else {
      setModoNueva(false);
      onCambio(v);
    }
  }

  function volverASelector() {
    setModoNueva(false);
    onCambio("");
  }

  if (cargando) {
    return (
      <div className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-500 text-sm">
        Cargando categorías...
      </div>
    );
  }

  if (modoNueva) {
    return (
      <div className="flex gap-2">
        <input
          type="text"
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          placeholder="Nombre de la nueva categoría"
          autoFocus
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
        {opciones.length > 0 && (
          <button
            type="button"
            onClick={volverASelector}
            className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Volver al selector"
          >
            ↩
          </button>
        )}
      </div>
    );
  }

  return (
    <select
      value={valor}
      onChange={handleSelectChange}
      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
    >
      <option value="">— Sin categoría —</option>
      {opciones.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
      <option value={NUEVA}>➕ Nueva categoría...</option>
    </select>
  );
}