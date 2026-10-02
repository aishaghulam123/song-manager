export default function CurrentSong({ loading, song, canManage, onDelete, deleting }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-base font-semibold text-card-foreground">Current Song</h2>

      {loading ? (
        <p className="mt-2 text-sm text-muted-foreground">Loading song...</p>
      ) : !song ? (
        <p className="mt-2 text-sm text-muted-foreground">
          No song has been added for this invitation yet.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-sm font-medium text-card-foreground">{song.invitationName}</p>
            <p className="break-all text-sm text-muted-foreground">{song.fileName}</p>
          </div>

          <audio controls preload="none" src={song.audioUrl} className="w-full">
            Your browser does not support audio playback.
          </audio>

          {canManage && (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="rounded-md border border-destructive px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
