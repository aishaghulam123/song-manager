// Add more invitations here — upload logic reads from this list only.
export const INVITATIONS = [
  { id: "bridal-shower", name: "Bridal Shower" },
  { id: "90s-dholki", name: "90s Dholki" },
  { id: "nikkah", name: "Nikkah" },
  { id: "shaadi", name: "Shaadi" },
  { id: "mehndi", name: "Mehndi" },
];

export function getInvitation(id) {
  return INVITATIONS.find((invitation) => invitation.id === id) || null;
}

export const AUDIO_EXTENSIONS = [".mp3", ".wav", ".m4a", ".ogg"];
export const AUDIO_MIME_PREFIX = "audio/";
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
