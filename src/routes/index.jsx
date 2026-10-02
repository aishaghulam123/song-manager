import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import ProtectedRoute from "../components/ProtectedRoute";
import InvitationSelector from "../components/InvitationSelector";
import SongUploader from "../components/SongUploader";
import CurrentSong from "../components/CurrentSong";
import { useAuth } from "../hooks/useAuth";
import { deleteSong, getActiveSong, uploadSong } from "../lib/songs";
import { friendlyError } from "../lib/errors";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Song Manager | Wedding Invitations" },
      {
        name: "description",
        content:
          "Upload and manage the background song for each digital wedding invitation in one place.",
      },
      { property: "og:title", content: "Song Manager | Wedding Invitations" },
      {
        property: "og:description",
        content:
          "Upload and manage the background song for each digital wedding invitation in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardRoute,
});

function DashboardRoute() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}

function Dashboard() {
  const { user, role, isAdmin, roleError, signOut, refreshRole } = useAuth();
  const [invitationId, setInvitationId] = useState("");
  const [song, setSong] = useState(null);
  const [loadingSong, setLoadingSong] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState(null); // { type: "success" | "error", message }

  const loadSong = useCallback(async (id) => {
    if (!id) {
      setSong(null);
      return;
    }
    setLoadingSong(true);
    try {
      setSong(await getActiveSong(id));
    } catch (error) {
      setSong(null);
      setStatus({ type: "error", message: friendlyError(error) });
    } finally {
      setLoadingSong(false);
    }
  }, []);

  useEffect(() => {
    setStatus(null);
    loadSong(invitationId);
  }, [invitationId, loadSong]);

  async function handleUpload(file, reset) {
    setUploading(true);
    setProgress(0);
    setStatus(null);
    try {
      const result = await uploadSong({
        invitationId,
        file,
        uid: user.uid,
        onProgress: setProgress,
      });
      reset();
      setStatus(
        result.cleanupFailed > 0
          ? {
              type: "error",
              message: `New song is live, but the previous file could not be removed from storage (${result.cleanupError || "unknown error"}). It will be retried on the next upload.`,
            }
          : { type: "success", message: "Song uploaded. The previous song was removed from storage." },
      );
      await loadSong(invitationId);
    } catch (error) {
      setStatus({
        type: "error",
        message: `${friendlyError(error)} The existing song was kept.`,
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  async function handleDelete() {
    if (!song) return;
    if (!window.confirm("Are you sure you want to delete this song?")) return;
    setDeleting(true);
    setStatus(null);
    try {
      await deleteSong(song);
      setSong(null);
      setStatus({ type: "success", message: "Song deleted." });
    } catch (error) {
      setStatus({ type: "error", message: friendlyError(error) });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Song Manager</h1>
          <p className="break-all text-sm text-muted-foreground">Welcome, {user.email}</p>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="rounded-md border border-input px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          Logout
        </button>
      </header>

      {roleError && <p className="mt-4 text-sm text-destructive">{roleError}</p>}

      <div className="mt-6 space-y-5">
        <InvitationSelector value={invitationId} onChange={setInvitationId} />

        {status && (
          <p
            className={`rounded-md px-3 py-2 text-sm ${
              status.type === "error"
                ? "bg-destructive/10 text-destructive"
                : "bg-accent text-accent-foreground"
            }`}
          >
            {status.message}
          </p>
        )}

        {invitationId && (
          <CurrentSong
            loading={loadingSong}
            song={song}
            canManage={isAdmin}
            onDelete={handleDelete}
            deleting={deleting}
          />
        )}

        {isAdmin ? (
          <SongUploader
            disabled={!invitationId}
            hasExistingSong={Boolean(song)}
            uploading={uploading}
            progress={progress}
            onUpload={handleUpload}
          />
        ) : (
          <section className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            {role === null ? (
              "Loading your access level..."
            ) : (
              <>
                <p>
                  You are logged in as a user. Song management is available to administrators only.
                </p>
                <p className="mt-3 break-all">
                  To become admin: Firebase Console → Firestore → <code>users</code> → document{" "}
                  <code>{user.uid}</code> → change <code>role</code> to <code>admin</code>.
                </p>
                <button
                  type="button"
                  onClick={refreshRole}
                  className="mt-3 rounded-md border border-input px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  I changed the role — check again
                </button>
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
