"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { generarCodigoBarras } from "@/lib/codigos";

export default function NuevoItemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codigoPrefill = searchParams.get("codigo") ?? "";

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [categoria, setCategoria] = useState("");
  const [tipoCodigo, setTipoCodigo] = useState<"auto" | "manual">(
    codigoPrefill ? "manual" : "auto"
  );
  const [codigoManual, setCodigoManual] = useState(codigoPrefill);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si llega un código por URL después del primer render, también prerrellenamos
  useEffect(() => {
    if (codigoPrefill) {
      setTipoCodigo("manual");
      setCodigoManual(codigoPrefill);
    }
  }, [codigoPrefill]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);

    const codigo_barras =
      tipoCodigo === "auto" ? generarCodigoBarras() : codigoManual.trim();

    if (!codigo_barras) {
      setError("Debes introducir un código de barras.");
      setGuardando(false);
      return;
    }

    const { data, error: dbError } = await supabase
      .from("items")
      .insert({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        cantidad,
        categoria: categoria.trim() || null,
        codigo_barras,
      })
      .select()
      .single();

    if (dbError) {
      if (dbError.code === "23505") {
        setError("Ya existe un item con ese código de barras.");
      } else {
        setError(dbError.message);
      }
      setGuardando(false);
      return;
    }

    router.push(`/inventario/${data.id}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link
          href="/inventario"
          className="inline-flex items-center text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white mb-8 transition-colors"
        >
          ← Volver al inventario
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
          Nuevo item
        </h1>

        {codigoPrefill && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 p-3 rounded-xl text-sm mb-6">
            📷 Código escaneado prerellenado: <span className="font-mono">{codigoPrefill}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Cargador USB-C"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalles opcionales..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Cantidad inicial
              </label>
              <input
                type="number"
                min={0}
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Categoría
              </label>
              <input
                type="text"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Ej: Electrónica"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Código de barras
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setTipoCodigo("auto")}
                className={`px-4 py-2.5 rounded-xl border-2 font-medium transition-colors ${
                  tipoCodigo === "auto"
                    ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400"
                }`}
              >
                🎲 Generar auto
              </button>
              <button
                type="button"
                onClick={() => setTipoCodigo("manual")}
                className={`px-4 py-2.5 rounded-xl border-2 font-medium transition-colors ${
                  tipoCodigo === "manual"
                    ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400"
                }`}
              >
                ⌨️ Manual / EAN
              </button>
            </div>
            {tipoCodigo === "manual" && (
              <input
                type="text"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value)}
                placeholder="Ej: 8410376002164"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono"
              />
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {tipoCodigo === "auto"
                ? "Se generará un código único al guardar."
                : "Introduce el código del producto (ej: el EAN de la caja)."}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-5 py-3 rounded-xl shadow-sm transition-colors"
            >
              {guardando ? "Guardando..." : "Guardar item"}
            </button>
            <Link
              href="/inventario"
              className="px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}