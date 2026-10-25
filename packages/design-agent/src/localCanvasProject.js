export const MAX_PROJECT_BYTES = 72 * 1024 * 1024;
const MAX_ASSET_BYTES = 10 * 1024 * 1024;
const MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);
const ID = /^[A-Za-z0-9_-]{1,128}$/;
function fail() { throw new Error('CANVAS_PROJECT_INVALID'); }
function object(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !allowed.includes(key))) fail();
}
function number(value, min, max) {
  if (!Number.isFinite(value) || value < min || value > max) fail();
  return value;
}
function flag(value) { if (value !== undefined && typeof value !== 'boolean') fail(); return value ?? false; }
function assetSize(data) {
  if (typeof data !== 'string' || !data.length || data.length > 4 * Math.ceil(MAX_ASSET_BYTES / 3) || data.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(data)) fail();
  return data.length / 4 * 3 - (data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0);
}
function normalizeAsset(asset) {
  object(asset, ['id', 'mime', 'data']);
  if (!ID.test(asset.id) || !MIME.has(asset.mime)) fail();
  const size = assetSize(asset.data);
  if (size <= 0 || size > MAX_ASSET_BYTES) fail();
  let header;
  try { header = atob(asset.data.slice(0, 16)); } catch { fail(); }
  const bytes = Array.from(header, c => c.charCodeAt(0));
  if (asset.mime === 'image/png' && ![137,80,78,71,13,10,26,10].every((b,i) => bytes[i] === b)) fail();
  if (asset.mime === 'image/jpeg' && !(bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)) fail();
  if (asset.mime === 'image/webp' && !(header.slice(0,4) === 'RIFF' && header.slice(8,12) === 'WEBP')) fail();
  return { id: asset.id, mime: asset.mime, data: asset.data };
}
export function normalizeProjectLayout(nodes, viewport, assetIds) {
  if (!Array.isArray(nodes) || nodes.length > 100) fail();
  object(viewport, ['x', 'y', 'zoom']);
  const view = { x: number(viewport.x, -1e7, 1e7), y: number(viewport.y, -1e7, 1e7), zoom: number(viewport.zoom, 1e-6, 5) };
  const ids = new Set();
  const layout = nodes.map(raw => {
    const common = ['id','kind','x','y','width','height','rotation','scaleX','scaleY','offsetX','offsetY','zIndex','hidden','locked'];
    object(raw, [...common, ...(raw.kind === 'image' ? ['assetId'] : ['text','fontSize','fill'])]);
    if (!['image','text'].includes(raw.kind) || typeof raw.id !== 'string' || !ID.test(raw.id) || !raw.id.startsWith(raw.kind === 'image' ? 'img-' : 'txt-') || ids.has(raw.id)) fail();
    ids.add(raw.id);
    const node = { id: raw.id, kind: raw.kind, x: number(raw.x,-1e7,1e7), y: number(raw.y,-1e7,1e7),
      rotation: number(raw.rotation ?? 0,-36000,36000), scaleX: number(raw.scaleX ?? 1,-100,100), scaleY: number(raw.scaleY ?? 1,-100,100),
      offsetX: number(raw.offsetX ?? 0,-1e6,1e6), offsetY: number(raw.offsetY ?? 0,-1e6,1e6),
      zIndex: number(raw.zIndex ?? 0,-1e6,1e6), hidden: flag(raw.hidden), locked: flag(raw.locked) };
    if (!Number.isInteger(node.zIndex) || Math.abs(node.scaleX) < 0.0001 || Math.abs(node.scaleY) < 0.0001) fail();
    if (raw.kind === 'image' || raw.width !== undefined) node.width = number(raw.width,0.01,1e6);
    if (raw.kind === 'image' || raw.height !== undefined) node.height = number(raw.height,0.01,1e6);
    if (raw.kind === 'image') {
      if (typeof raw.assetId !== 'string' || !assetIds.has(raw.assetId)) fail();
      node.assetId = raw.assetId;
    } else {
      if (typeof raw.text !== 'string' || raw.text.length > 6000) fail();
      node.text = raw.text; node.fontSize = number(raw.fontSize ?? 24,1,512);
      node.fill = raw.fill ?? 'white';
      if (typeof node.fill !== 'string' || !/^(?:white|black|#[a-fA-F0-9]{3}|#[a-fA-F0-9]{4}|#[a-fA-F0-9]{6}|#[a-fA-F0-9]{8})$/.test(node.fill)) fail();
    }
    return node;
  });
  return { nodes: layout, viewport: view };
}
export function normalizeCanvasProject(value) {
  object(value,['format','version','assets','nodes','viewport']);
  if (value.format !== 'fyt-canvas' || value.version !== 1 || !Array.isArray(value.assets) || value.assets.length > 20) fail();
  const assets = value.assets.map(normalizeAsset);
  const assetIds = new Set(assets.map(asset => asset.id));
  if (assetIds.size !== assets.length || assets.reduce((sum,asset) => sum+assetSize(asset.data),0) > 50*1024*1024) fail();
  const layout = normalizeProjectLayout(value.nodes,value.viewport,assetIds);
  const referenced = new Set(layout.nodes.filter(n => n.kind === 'image').map(n=>n.assetId));
  if (referenced.size !== assetIds.size) fail();
  return { format: 'fyt-canvas', version: 1, assets, ...layout };
}
export function parseCanvasProject(text) {
  if (typeof text !== 'string' || text.length > MAX_PROJECT_BYTES) fail();
  let data;
  try { data = JSON.parse(text.replace(/^\uFEFF/, '')); } catch { fail(); }
  return normalizeCanvasProject(data);
}
export function projectAssetBlob(asset) {
  const normalized = normalizeAsset(asset);
  let raw;
  try { raw = atob(normalized.data); } catch { fail(); }
  return new Blob([Uint8Array.from(raw,c=>c.charCodeAt(0))], {type:normalized.mime});
}
function base64(bytes) {
  const parts = [];
  for (let i=0;i<bytes.length;i+=8192) parts.push(String.fromCharCode(...bytes.subarray(i,i+8192)));
  return btoa(parts.join(''));
}
export async function buildCanvasProject(snapshot, sources, {signal} = {}) {
  signal?.throwIfAborted();
  const referenced = new Map();
  for (const node of snapshot.nodes) {
    if (node.kind !== 'image') continue;
    if (!referenced.has(node.src)) {
      const file = sources.get(node.src)?.file;
      if (!file) fail();
      referenced.set(node.src,{ id:`asset-${referenced.size}`, file });
    }
  }
  const assets = [];
  for (const {id,file} of referenced.values()) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    signal?.throwIfAborted();
    assets.push({id,mime:file.type,data:base64(bytes)});
  }
  const allowed = ['id','kind','x','y','width','height','rotation','scaleX','scaleY','offsetX','offsetY','zIndex','hidden','locked','text','fontSize','fill'];
  const nodes = snapshot.nodes.map(raw => {
    const node = Object.fromEntries(allowed.filter(key => raw[key] !== undefined).map(key => [key,raw[key]]));
    if (node.kind === 'image') node.assetId = referenced.get(raw.src)?.id;
    return node;
  });
  return normalizeCanvasProject({format:'fyt-canvas',version:1,assets,nodes,viewport:snapshot.viewport});
}
export async function prepareCanvasProject(project, loadImage, {signal} = {}) {
  signal?.throwIfAborted();
  const normalized = normalizeCanvasProject(project);
  const prepared = new Map();
  let pixels = 0;
  try {
    for (const asset of normalized.assets) {
      signal?.throwIfAborted();
      const file = projectAssetBlob(asset);
      const loaded = await loadImage(file,{signal});
      prepared.set(asset.id,{...loaded,file});
      signal?.throwIfAborted();
      pixels += loaded.image.naturalWidth * loaded.image.naturalHeight;
      if (pixels > 32000000) throw new Error('CANVAS_PROJECT_PIXELS');
    }
    return { project: normalized, assets: prepared };
  } catch (error) {
    for (const loaded of prepared.values()) loaded.release();
    throw error;
  }
}
