import { useRef, useState } from "react";
import { formatTime, parseTime } from "../lib/clip";

const smallButton =
  "rounded-md border border-input px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent";
const timeInput =
  "w-28 rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground";

/**
 * Lets the admin pick which part of a song should play.
 * Play the song, pause where you want, tap "Set start here" / "Set end here".
 * Leave both boxes empty to use the whole song.
 */
export default function ClipEditor({
  src,
  startText,
  endText,
  onStartText,
  onEndText,
  duration,
  onDuration,
  error,
}) {
  const audioRef = useRef(null);
  const [previewing, setPreviewing] = useState(false);

  const start = parseTime(startText);
  const end = parseTime(endText);

  function markHere(setText) {
    const audio = audioRef.current;
    if (audio) setText(formatTime(audio.currentTime));
  }

  function previewClip() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number.isFinite(start) ? start : 0;
    audio
      .play()
      .then(() => setPreviewing(true))
      .catch(() => {});
  }

  // While previewing, stop at the chosen end point.
  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (previewing && audio && Number.isFinite(end) && audio.currentTime >= end) {
      audio.pause();
      setPreviewing(false);
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <div>
        <p className="text-sm font-medium text-card-foreground">
          Play only part of the song (optional)
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Play the song below, pause at the right moment and tap &quot;Set start here&quot; or
          &quot;Set end here&quot;. You can also type the times (like 75 or 1:15). Leave both empty
          to use the whole song.
        </p>
      </div>

      <audio
        ref={audioRef}
        controls
        preload="metadata"
        src={src}
        className="w-full"
        onLoadedMetadata={(event) => onDuration(event.currentTarget.duration)}
        onTimeUpdate={handleTimeUpdate}
        onPause={() => setPreviewing(false)}
      >
        Your browser does not support audio playback.
      </audio>
      {duration ? (
        <p className="text-xs text-muted-foreground">Song length: {formatTime(duration)}</p>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm text-muted-foreground">
          <span className="block">Start</span>
          <input
            type="text"
            inputMode="decimal"
            value={startText}
            onChange={(event) => onStartText(event.target.value)}
            placeholder="0:00"
            className={timeInput}
          />
        </label>
        <label className="space-y-1 text-sm text-muted-foreground">
          <span className="block">End</span>
          <input
            type="text"
            inputMode="decimal"
            value={endText}
            onChange={(event) => onEndText(event.target.value)}
            placeholder="end of song"
            className={timeInput}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={smallButton} onClick={() => markHere(onStartText)}>
          Set start here
        </button>
        <button type="button" className={smallButton} onClick={() => markHere(onEndText)}>
          Set end here
        </button>
        <button type="button" className={smallButton} onClick={previewClip}>
          ▶ Preview clip
        </button>
        <button
          type="button"
          className={smallButton}
          onClick={() => {
            onStartText("");
            onEndText("");
          }}
        >
          Use whole song
        </button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
