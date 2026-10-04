import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { requireFirebase } from "./firebase";
import { getInvitation } from "../config/invitations";
import { deleteStorageFile, uploadAudioFile } from "./storage";
import { buildClipUrl } from "./clip";

const SONGS = "songs";

function mapSong(docSnap) {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    invitationId: data.invitationId,
    invitationName: data.invitationName,
    fileName: data.fileName,
    audioUrl: data.audioUrl, // what invitations play (trimmed if a clip was chosen)
    originalUrl: data.originalUrl || data.audioUrl, // the full song
    startOffset: data.startOffset ?? null, // seconds, null = from the beginning
    endOffset: data.endOffset ?? null, // seconds, null = until the end
    storagePath: data.storagePath,
    uploadedBy: data.uploadedBy,
    createdAt: data.createdAt || null,
  };
}

// Returns the full active song record for an invitation, or null.
export async function getActiveSong(invitationId) {
  const { db } = requireFirebase();
  const snapshot = await getDocs(
    query(
      collection(db, SONGS),
      where("invitationId", "==", invitationId),
      orderBy("createdAt", "desc"),
      limit(1),
    ),
  );
  if (snapshot.empty) return null;
  return mapSong(snapshot.docs[0]);
}

/**
 * Drop-in helper for invitation websites.
 * const song = await getInvitationSong("90s-dholki");
 * if (song) audioElement.src = song.audioUrl;
 */
export async function getInvitationSong(invitationId) {
  const song = await getActiveSong(invitationId);
  if (!song) return null;
  return {
    audioUrl: song.audioUrl,
    fileName: song.fileName,
    invitationId: song.invitationId,
  };
}

// Every song record for an invitation (used when replacing).
async function getAllSongs(invitationId) {
  const { db } = requireFirebase();
  const snapshot = await getDocs(
    query(collection(db, SONGS), where("invitationId", "==", invitationId)),
  );
  return snapshot.docs.map(mapSong);
}

export async function deleteSong(song) {
  const { db } = requireFirebase();
  // Storage first; the Firestore record is only removed once the file is really gone.
  await deleteStorageFile(song.storagePath);
  await deleteDoc(doc(db, SONGS, song.id));
}

/**
 * Uploads a new song for an invitation. Any previous song is removed only
 * AFTER the new upload and Firestore write succeed.
 */
export async function uploadSong({ invitationId, file, uid, onProgress, startOffset = null, endOffset = null }) {
  const { db } = requireFirebase();
  const invitation = getInvitation(invitationId);
  if (!invitation) throw new Error("Unknown invitation.");

  const previous = await getAllSongs(invitationId);

  const { storagePath, audioUrl: originalUrl } = await uploadAudioFile(invitationId, file, onProgress);
  // Invitations get the trimmed link; the full file stays stored so the clip can be edited later.
  const audioUrl = buildClipUrl(originalUrl, startOffset, endOffset);

  let created;
  try {
    created = await addDoc(collection(db, SONGS), {
      invitationId: invitation.id,
      invitationName: invitation.name,
      fileName: file.name,
      audioUrl,
      originalUrl,
      startOffset,
      endOffset,
      storagePath,
      uploadedBy: uid,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // Roll the orphaned upload back so storage stays clean.
    await deleteStorageFile(storagePath).catch(() => {});
    throw error;
  }

  // New song is live — now delete the old ones from storage AND Firestore so storage
  // never fills up. If a delete fails, its record is kept and the next upload retries it.
  let cleanupFailed = 0;
  let cleanupError = "";
  for (const old of previous) {
    try {
      await deleteSong(old);
    } catch (error) {
      cleanupFailed += 1;
      cleanupError = error?.message || "";
      console.error("Could not delete the previous song:", error);
    }
  }

  return {
    id: created.id,
    invitationId,
    invitationName: invitation.name,
    fileName: file.name,
    audioUrl,
    originalUrl,
    startOffset,
    endOffset,
    storagePath,
    uploadedBy: uid,
    cleanupFailed,
    cleanupError,
  };
}

/**
 * Changes which part of the song is played, WITHOUT uploading again.
 * Pass null for "from the beginning" (start) or "until the end" (end).
 */
export async function updateSongClip(song, startOffset, endOffset) {
  const { db } = requireFirebase();
  const originalUrl = song.originalUrl || song.audioUrl;
  const audioUrl = buildClipUrl(originalUrl, startOffset, endOffset);
  await updateDoc(doc(db, SONGS, song.id), { originalUrl, audioUrl, startOffset, endOffset });
  return { ...song, originalUrl, audioUrl, startOffset, endOffset };
}