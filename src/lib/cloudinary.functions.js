// Server function: deletes an audio file from Cloudinary.
// Deleting needs Cloudinary's API secret, which must NEVER reach the browser, so this
// runs on the server. It only works for signed-in Firebase users whose
// users/{uid}.role is "admin" (verified server-side through Firestore security rules).
import { createServerFn } from "@tanstack/react-start";

const PUBLIC_ID_PREFIX = "wedding-songs/";

function decodeJwtPayload(token) {
  const part = token.split(".")[1] || "";
  const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  return JSON.parse(atob(padded));
}

// Reads users/{uid} with the caller's own ID token. Firestore verifies the token and
// applies firestore.rules, so a forged token or a non-owner gets a 401/403 here.
async function assertAdmin(idToken) {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  let uid;
  try {
    const payload = decodeJwtPayload(idToken);
    uid = payload.user_id || payload.sub;
  } catch {
    throw new Error("Invalid sign-in token.");
  }
  if (!uid || !projectId) throw new Error("Not authorised.");

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${encodeURIComponent(uid)}`,
    { headers: { Authorization: `Bearer ${idToken}` } },
  );
  if (!response.ok) throw new Error("Not authorised.");
  const userDoc = await response.json();
  if (userDoc?.fields?.role?.stringValue !== "admin") {
    throw new Error("Only administrators can delete songs.");
  }
}

async function sha1Hex(text) {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export const deleteCloudinaryAudio = createServerFn({ method: "POST" })
  .inputValidator((data) => {
    if (!data || typeof data.idToken !== "string" || typeof data.publicId !== "string") {
      throw new Error("Invalid request.");
    }
    // Only files inside our own songs folder can ever be deleted.
    if (!data.publicId.startsWith(PUBLIC_ID_PREFIX) || data.publicId.includes("..")) {
      throw new Error("Invalid file.");
    }
    return { idToken: data.idToken, publicId: data.publicId };
  })
  .handler(async ({ data }) => {
    await assertAdmin(data.idToken);

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        "Cloudinary delete is not configured on the server. Set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET (see SETUP.md).",
      );
    }

    // Cloudinary signature: SHA-1 of the sorted params + secret.
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await sha1Hex(`public_id=${data.publicId}&timestamp=${timestamp}${apiSecret}`);

    const body = new URLSearchParams({
      public_id: data.publicId,
      timestamp: String(timestamp),
      api_key: apiKey,
      signature,
    });
    // Audio is stored under Cloudinary's "video" resource type.
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/destroy`, {
      method: "POST",
      body,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result?.error?.message || "Cloudinary could not delete the file.");
    }
    // "ok" = deleted, "not found" = already gone. Both mean the file is not stored anymore.
    return { ok: true, result: result.result };
  });
