"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const apps = [
  {
    nombre: "Inventario",
    descripcion: "Gestiona tus cosas con códigos de barras",
    icono: "📦",
    href: "/inventario",
    activo: true,
    color: "from-blue-500 to-cyan-500",
  },
  {
    nombre: "Próximamente",
    descripcion: "Aquí irá tu siguiente mini-app",
    icono: "✨",
    href: "#",
    activo: false,
    color: "from-gray-400 to-gray-500",
  },
];

export default function Home() {
  const router = useRouter();

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <header className="mb-12 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-2">
              Mi Hub
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Tus aplicaciones personales, todas en un sitio.
            </p>
          </div>
          <button
            onClick={cerrarSesion}
            className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 transition-colors"
          >
            🚪 Cerrar sesión
          </button>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) =>
            app.activo ? (
              <Link
                key={app.nombre}
                href={app.href}
                className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <div className="relative">
                  <div className="text-5xl mb-4">{app.icono}</div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
                    {app.nombre}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {app.descripcion}
                  </p>
                </div>
              </Link>
            ) : (
              <div
                key={app.nombre}
                className="relative overflow-hidden rounded-2xl bg-white/50 dark:bg-slate-800/50 p-6 border-2 border-dashed border-slate-300 dark:border-slate-700"
              >
                <div className="text-5xl mb-4 opacity-40">{app.icono}</div>
                <h2 className="text-xl font-semibold text-slate-400 dark:text-slate-500 mb-1">
                  {app.nombre}
                </h2>
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  {app.descripcion}
                </p>
              </div>
            )
          )}
        </section>

        <footer className="mt-16 text-center text-sm text-slate-400 dark:text-slate-500">
          Hecho por Joel · v0.1
        </footer>
      </div>
    </main>
  );
}