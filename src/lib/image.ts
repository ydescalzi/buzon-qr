/**
 * Lee una imagen, la recorta al centro con proporción de foto carnet (3:4)
 * y la reduce para que no pese mucho en la base de datos.
 */
export function prepararFoto(file: File, ancho = 360, alto = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen no válido'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = ancho;
        canvas.height = alto;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas no disponible'));
        const escala = Math.max(ancho / img.width, alto / img.height);
        const w = img.width * escala;
        const h = img.height * escala;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, ancho, alto);
        ctx.drawImage(img, (ancho - w) / 2, (alto - h) / 2, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Para logos: mantiene la proporción, fondo transparente (PNG). */
export function prepararLogo(file: File, max = 300): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Formato de imagen no válido'));
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
