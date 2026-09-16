// Firebase Storage download URLs carry a query string (?alt=media&token=…),
// so the extension has to be read from the path, not the whole URL.
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v|ogv)$/i;

export function isVideoUrl(url) {
    if (!url) return false;
    const path = url.split("?")[0];
    return VIDEO_EXTENSIONS.test(path);
}

// Ribbed placeholder textures, used for empty slots and for images the
// browser can't decode (HEIC straight off an iPhone is the common case).
export const TEXTURES = ["tl-tex-0", "tl-tex-1", "tl-tex-2", "tl-tex-0"];
