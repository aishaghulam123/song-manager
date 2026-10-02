import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { requireFirebase } from "./firebase";

/**
 * Returns users/{uid}. If it does not exist yet (e.g. Firestore was created after
 * signup, or the first write failed) it is created with role "user".
 * Safe to call on every login. The role can only be raised to "admin" manually
 * in the Firebase console.
 */
export async function ensureUserDocument(uid, email) {
  const { db } = requireFirebase();
  const ref = doc(db, "users", uid);
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) return { uid, ...snapshot.data() };

  await setDoc(ref, { email: email || "", role: "user", createdAt: serverTimestamp() });
  return { uid, email: email || "", role: "user" };
}

export async function getUserDocument(uid) {
  const { db } = requireFirebase();
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? { uid, ...snapshot.data() } : null;
}
