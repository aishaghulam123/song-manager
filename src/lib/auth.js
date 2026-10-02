import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { requireFirebase } from "./firebase";
import { ensureUserDocument } from "./firestore";

export function watchAuthState(callback) {
  const { auth } = requireFirebase();
  return onAuthStateChanged(auth, callback);
}

export async function signUp(email, password) {
  const { auth } = requireFirebase();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  // Role is always "user" — never selectable by the person signing up.
  await ensureUserDocument(credential.user.uid, credential.user.email);
  return credential.user;
}

export async function logIn(email, password) {
  const { auth } = requireFirebase();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logOut() {
  const { auth } = requireFirebase();
  await signOut(auth);
}

// Reads the role from Firestore (creating the users/{uid} document if it is missing).
export async function fetchRole(uid, email) {
  const profile = await ensureUserDocument(uid, email);
  return profile?.role === "admin" ? "admin" : "user";
}
