import { useEffect, useState } from "react";
import { formatTime, validateClip } from "../lib/clip";
import ClipEditor from "./ClipEditor";

function clipLabel(song) {
  const hasStart = song.startOffset !== null && song.startOffset > 0;
  const hasEnd = song.endOffset !== null;
  if (!hasStart && !hasEnd) return "Playing the full song";
  const from = hasStart ? formatTime(song.startOffset) : "0:00";
  const to = hasEnd ? formatTime(song.endOffset) : "end of song";
  return `Playing only: ${from} → ${to}`;
}

export default function CurrentSong({
  loading,
  song,
  canManage,
  onDelete,
  deleting,
  onUpdateClip,
  savingClip,
}) {
  const [editing, setEditing] = useState(false);
  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");
  const [duration, setDuration] = useState(0);

  // Close the editor whenever another song is shown.
  useEffect(() => {
    setEditing(false);
  }, [song?.id]);

  const clip = validateClip(startText, endText, duration);

  function openEditor() {
    setStartText(song.startOffset ? formatTime(song.startOffset) : "");
    setEndText(song.endOffset !== null ? formatTime(song.endOffset) : "");
    setDuration(0);
    setEditing(true);
  }

  async function saveClip() {
    if (clip.error) return;
    const ok = await onUpdateClip(clip.start, clip.end);
    if (ok) setEditing(false);
  }

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
            <p className="mt-1 text-sm text-muted-foreground">{clipLabel(song)}</p>
          </div>

          {/* This is exactly what the invitation plays. */}
          <audio controls preload="none" src={song.audioUrl} className="w-full">
            Your browser does not support audio playback.
          </audio>

          {canManage && editing && (
            <div className="space-y-3">
              <ClipEditor
                src={song.originalUrl}
                startText={startText}
                endText={endText}
                onStartText={setStartText}
                onEndText={setEndText}
                duration={duration}
                onDuration={setDuration}
                error={clip.error}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={saveClip}
                  disabled={savingClip || Boolean(clip.error)}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {savingClip ? "Saving..." : "Save clip"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  disabled={savingClip}
                  className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {canManage && !editing && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openEditor}
                className="rounded-md border border-input px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                Edit clip
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="rounded-md border border-destructive px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}