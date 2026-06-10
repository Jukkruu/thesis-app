// In-memory + sessionStorage file store for the demo.
// Stores actual file data URLs keyed by upload ID.
// Memory survives navigation; sessionStorage survives page refresh within the tab.

const mem = new Map<string, string>();

export function storeFile(uploadId: string, dataUrl: string): void {
  mem.set(uploadId, dataUrl);
  try {
    sessionStorage.setItem(`thesis_file_${uploadId}`, dataUrl);
  } catch {
    // ignore if sessionStorage is full
  }
}

export function getFile(uploadId: string): string | null {
  if (mem.has(uploadId)) return mem.get(uploadId)!;
  try {
    const v = sessionStorage.getItem(`thesis_file_${uploadId}`);
    if (v) { mem.set(uploadId, v); return v; }
  } catch {}
  return null;
}

export function deleteFile(uploadId: string): void {
  mem.delete(uploadId);
  try { sessionStorage.removeItem(`thesis_file_${uploadId}`); } catch {}
}

export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror   = reject;
    reader.readAsDataURL(file);
  });
}
