export const FIREBASE_STORAGE_BASE_URL = (import.meta as any).env.VITE_FIREBASE_STORAGE_BASE_URL



export function getFullFirebaseImageURL(relativePath?: string) {
    if (!relativePath) return undefined
    const encodedPath = encodeURIComponent(relativePath);
    return `${FIREBASE_STORAGE_BASE_URL}${encodedPath}?alt=media`;
}