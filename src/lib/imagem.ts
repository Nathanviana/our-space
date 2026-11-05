// Preparação das fotos no navegador antes do envio (RNF-04; PRD v3 7.6)
// Lê a localização e a data gravadas na foto (quando o celular não removeu) e gera
// a foto reduzida e a miniatura em JPEG.

export interface FotoPreparada {
  foto: Blob;
  mini: Blob;
  latitude: number | null;
  longitude: number | null;
  tiradaEm: string | null;
  previa: string;
}

const LADO_FOTO = 1600;
const LADO_MINI = 480;

async function lerMetadados(arquivo: File) {
  try {
    const exifr = (await import("exifr")).default;
    const dados = await exifr.parse(arquivo, { gps: true, pick: ["DateTimeOriginal", "latitude", "longitude"] });
    const lat = typeof dados?.latitude === "number" ? dados.latitude : null;
    const lng = typeof dados?.longitude === "number" ? dados.longitude : null;
    const data = dados?.DateTimeOriginal instanceof Date ? dados.DateTimeOriginal.toISOString() : null;
    return { latitude: lat, longitude: lng, tiradaEm: data };
  } catch {
    return { latitude: null, longitude: null, tiradaEm: null };
  }
}

async function decodificar(arquivo: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(arquivo, { imageOrientation: "from-image" });
  } catch {
    const url = URL.createObjectURL(arquivo);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function reduzir(img: ImageBitmap | HTMLImageElement, lado: number, qualidade: number): Promise<Blob> {
  const w = "naturalWidth" in img ? img.naturalWidth : img.width;
  const h = "naturalHeight" in img ? img.naturalHeight : img.height;
  const escala = Math.min(1, lado / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * escala);
  canvas.height = Math.round(h * escala);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Sem suporte a canvas");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((ok, falha) =>
    canvas.toBlob((b) => (b ? ok(b) : falha(new Error("Falha ao gerar a imagem"))), "image/jpeg", qualidade),
  );
}

export async function prepararFoto(arquivo: File): Promise<FotoPreparada> {
  const [meta, img] = await Promise.all([lerMetadados(arquivo), decodificar(arquivo)]).catch(() => {
    throw new Error(`Não consegui abrir "${arquivo.name}". Tente enviar em JPEG.`);
  });
  const [foto, mini] = await Promise.all([reduzir(img, LADO_FOTO, 0.82), reduzir(img, LADO_MINI, 0.72)]);
  if ("close" in img) img.close();
  return { foto, mini, ...meta, previa: URL.createObjectURL(mini) };
}
