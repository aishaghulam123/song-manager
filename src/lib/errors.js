// Translates Firebase error codes into friendly language.
const MESSAGES = {
  "auth/email-already-in-use": "That email already has an account. Try logging in instead.",
  "auth/invalid-email": "That email address doesn't look valid.",
  "auth/missing-password": "Please enter a password.",
  "auth/weak-password": "Password is too weak. Use at least 6 characters.",
  "auth/user-not-found": "No account found with that email.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed": "Network problem. Check your connection and try again.",
  "auth/operation-not-allowed": "Email/password sign-in is not enabled in Firebase Console.",
  "permission-denied": "You don't have permission to do that.",
};

export function friendlyError(error) {
  if (!error) return "Something went wrong.";
  const code = error.code || "";
  return MESSAGES[code] || error.message || "Something went wrong.";
}
