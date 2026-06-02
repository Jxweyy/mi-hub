// Tipos parciales de la respuesta de Open Food Facts (solo lo que usamos)
type OFFProduct = {
  product_name?: string;
  product_name_es?: string;
  generic_name?: string;
  brands?: string;
  quantity?: string;
  image_url?: string;
  image_front_url?: string;
  categories?: string;
  categories_tags?: string[];
};

type OFFResponse = {
  status: 0 | 1;
  product?: OFFProduct;
};

export type ProductoOFF = {
  nombre: string;
  categoria: string | null;
  imagenUrl: string | null;
};

/**
 * Busca un producto en Open Food Facts por su código de barras (EAN).
 * Devuelve null si no se encuentra.
 */
export async function buscarEnOpenFoodFacts(
  codigo: string
): Promise<ProductoOFF | null> {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
      codigo
    )}.json?fields=product_name,product_name_es,generic_name,brands,quantity,image_url,image_front_url,categories,categories_tags&lc=es`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "MiHub - Personal Inventory App",
      },
    });

    if (!res.ok) return null;

    const data: OFFResponse = await res.json();

    if (data.status !== 1 || !data.product) return null;

    const p = data.product;

    // Construir nombre legible: usar el nombre en español si existe, si no el general
    const nombreBase =
      p.product_name_es?.trim() ||
      p.product_name?.trim() ||
      p.generic_name?.trim() ||
      "";

    const marca = p.brands?.split(",")[0]?.trim();
    const cantidad = p.quantity?.trim();

    // Si tenemos marca y nombre, los juntamos
    let nombre = nombreBase;
    if (marca && nombreBase && !nombreBase.toLowerCase().includes(marca.toLowerCase())) {
      nombre = `${marca} ${nombreBase}`;
    } else if (!nombreBase && marca) {
      nombre = marca;
    }
    if (cantidad) nombre = `${nombre} ${cantidad}`.trim();

    if (!nombre) return null;

    // Categoría: la última suele ser la más específica
    let categoria: string | null = null;
    if (p.categories) {
      const partes = p.categories.split(",").map((s) => s.trim());
      categoria = partes[partes.length - 1] || null;
    }

    const imagenUrl = p.image_front_url || p.image_url || null;

    return {
      nombre,
      categoria,
      imagenUrl,
    };
  } catch (err) {
    console.error("Error buscando en Open Food Facts:", err);
    return null;
  }
}