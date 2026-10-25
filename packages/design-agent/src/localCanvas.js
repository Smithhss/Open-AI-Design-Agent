export const MAX_LOCAL_NODES = 100;
export function validateCanvasText(value) {
  if (typeof value !== 'string' || value.length > 6000) throw new Error('CANVAS_TEXT_LIMIT');
  if (!value.trim()) throw new Error('CANVAS_TEXT_EMPTY');
  return value.trim();
}
export function localCanvasBounds(rects, { forExport = true } = {}) {
  if (!rects.length) throw new Error('CANVAS_EMPTY');
  if (rects.some(r => !r || !['x','y','width','height'].every(k => Number.isFinite(r[k])) || r.width <= 0 || r.height <= 0)) throw new Error('CANVAS_INVALID_BOUNDS');
  const x = Math.floor(Math.min(...rects.map(r => r.x))) - 24;
  const y = Math.floor(Math.min(...rects.map(r => r.y))) - 24;
  const width = Math.ceil(Math.max(...rects.map(r => r.x + r.width))) + 24 - x;
  const height = Math.ceil(Math.max(...rects.map(r => r.y + r.height))) + 24 - y;
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) throw new Error('CANVAS_INVALID_BOUNDS');
  if (forExport && (width > 8192 || height > 8192 || width * height > 16000000)) throw new Error('CANVAS_EXPORT_TOO_LARGE');
  return { x, y, width, height };
}

export function localCanvasFit(rects, viewport) {
  if (!Number.isFinite(viewport.width) || !Number.isFinite(viewport.height) || viewport.width <= 0 || viewport.height <= 0) throw new Error('CANVAS_INVALID_VIEWPORT');
  const bounds = localCanvasBounds(rects, { forExport: false });
  const zoom = Math.min(5, viewport.width / bounds.width, viewport.height / bounds.height);
  return { zoom, x: viewport.width / 2 - (bounds.x + bounds.width / 2) * zoom,
    y: viewport.height / 2 - (bounds.y + bounds.height / 2) * zoom };
}
