import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isFirebaseConfigured } from "../lib/firebase";
import { fetchRole, logOut, watchAuthState } from "../lib/auth";
import { friendlyError } from "../lib/errors";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleError, setRoleError] = useState("");

  const loadRole = useCallback(async (firebaseUser) => {
    setRoleError("");
    try {
      // Role always comes from Firestore; the users/{uid} doc is created if missing.
      setRole(await fetchRole(firebaseUser.uid, firebaseUser.email));
    } catch (error) {
      console.error("Could not load users/{uid} from Firestore:", error);
      setRole("user");
      setRoleError(
        `Could not load your profile from Firestore (${friendlyError(error)}). ` +
          "Check that the Firestore database exists and firestore.rules are published (see SETUP.md).",
      );
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return undefined;
    }
    const unsubscribe = watchAuthState(async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setRole(null);
        setRoleError("");
        setLoading(false);
        return;
      }
      await loadRole(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, [loadRole]);

  // Re-read the role after it was changed in the Firebase console (no re-login needed).
  const refreshRole = useCallback(async () => {
    if (user) await loadRole(user);
  }, [user, loadRole]);

  const signOutUser = useCallback(async () => {
    await logOut();
  }, []);

  const value = useMemo(
    () => ({
      user,
      role,
      loading,
      roleError,
      isAdmin: role === "admin",
      configured: isFirebaseConfigured,
      signOut: signOutUser,
      refreshRole,
    }),
    [user, role, loading, roleError, signOutUser, refreshRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
