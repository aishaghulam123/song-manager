// Audio storage on Cloudinary (free plan, no credit card).
// Upload: straight from the browser using an UNSIGNED upload preset.
// Delete: through a server function (src/lib/cloudinary.functions.js) because deleting
//         needs the secret API key.
import { requireFirebase } from "./firebase";
import { deleteCloudinaryAudio } from "./cloudinary.functions";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const isStorageConfigured = Boolean(CLOUD_NAME && UPLOAD_PRESET);

// Unique id inside wedding-songs/{invitationId}/ — uploads never collide.
export function buildPublicId(invitationId) {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `wedding-songs/${invitationId}/${unique}`;
}

// Uploads a file and resolves with { storagePath, audioUrl }.
// storagePath is Cloudinary's public_id (used later to delete the file).
export function uploadAudioFile(invitationId, file, onProgress) {
  if (!isStorageConfigured) {
    return Promise.reject(
      new Error(
        "Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to .env and restart.",
      ),
    );
  }

  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", UPLOAD_PRESET);
    form.append("public_id", buildPublicId(invitationId));

    const xhr = new XMLHttpRequest();
    // Cloudinary keeps audio under the "video" resource type.
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`);

    xhr.upload.onprogress = (event) => {
      if (onProgress && event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      let result = null;
      try {
        result = JSON.parse(xhr.responseText);
      } catch {
        /* handled below */
      }
      if (xhr.status >= 200 && xhr.status < 300 && result?.secure_url && result?.public_id) {
        resolve({ storagePath: result.public_id, audioUrl: result.secure_url });
      } else {
        reject(new Error(result?.error?.message || "Upload failed. Please try again."));
      }
    };
    xhr.onerror = () => reject(new Error("Network problem during upload. Please try again."));
    xhr.send(form);
  });
}

// Permanently removes the file from Cloudinary (admin only, checked on the server).
export async function deleteStorageFile(storagePath) {
  if (!storagePath) return;
  const { auth } = requireFirebase();
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Please log in again.");
  await deleteCloudinaryAudio({ data: { idToken, publicId: storagePath } });
}
