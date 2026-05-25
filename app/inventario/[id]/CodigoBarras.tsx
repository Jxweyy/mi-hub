"use client";

import { useEffect, useRef, useState } from "react";
import bwipjs from "bwip-js/browser";

export default function CodigoBarras({ codigo }: { codigo: string }) {
  const svgRef = useRef<HTMLDivElement>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!svgRef.current) return;

    const esEAN13 = /^\d{13}$/.test(codigo);
    const esEAN8 = /^\d{8}$/.test(codigo);
    const formato = esEAN13 ? "ean13" : esEAN8 ? "ean8" : "code128";

    try {
      const svg = bwipjs.toSVG({
        bcid: formato,
        text: codigo,
        scale: 2,
        height: 12,
        includetext: false, // <-- NO dibujar texto dentro del código
        backgroundcolor: "FFFFFF",
      });
      svgRef.current.innerHTML = svg;
    } catch (err) {
      svgRef.current.innerHTML = `<p style="color:red;font-size:12px">Error al generar código: ${err}</p>`;
    }
  }, [codigo]);

  async function copiarCodigo() {
    await navigator.clipboard.writeText(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function imprimir() {
    window.print();
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div
        ref={svgRef}
        className="flex justify-center items-center mb-3 [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:max-h-[140px]"
      />

      <p className="text-center font-mono text-sm text-slate-700 tracking-widest mb-4 select-all">
        {codigo}
      </p>

      <div className="grid grid-cols-2 gap-2 print:hidden">
        <button
          onClick={copiarCodigo}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-3 rounded-xl transition-colors text-sm"
        >
          {copiado ? "✓ Copiado" : "📋 Copiar código"}
        </button>
        <button
          onClick={imprimir}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-3 rounded-xl transition-colors text-sm"
        >
          🖨️ Imprimir
        </button>
      </div>
    </div>
  );
}