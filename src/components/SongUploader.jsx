import { useRef, useState } from "react";
import { AUDIO_EXTENSIONS, MAX_FILE_SIZE_BYTES } from "../config/invitations";

function validate(file) {
  if (!file) return "Please choose a file.";
  const name = file.name.toLowerCase();
  const extensionOk = AUDIO_EXTENSIONS.some((ext) => name.endsWith(ext));
  const typeOk = (file.type || "").startsWith("audio/");
  if (!extensionOk && !typeOk) {
    return `Unsupported file type. Allowed: ${AUDIO_EXTENSIONS.join(", ")}`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "File is too large. Maximum size is 15 MB.";
  }
  return "";
}

export default function SongUploader({ disabled, hasExistingSong, uploading, progress, onUpload }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  function handleFileChange(event) {
    const selected = event.target.files?.[0] || null;
    const message = selected ? validate(selected) : "";
    setError(message);
    setFile(message ? null : selected);
  }

  function handleUpload() {
    if (uploading || !file) return;
    if (hasExistingSong) {
      const ok = window.confirm(
        "This invitation already has a song.\n\nReplace it? The old song will be permanently deleted from storage.",
      );
      if (!ok) return;
    }
    onUpload(file, () => {
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-base font-semibold text-card-foreground">
        {hasExistingSong ? "Replace Song" : "Upload Song"}
      </h2>

      {disabled ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Select an invitation above to upload a song.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.ogg"
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
          />

          {file && (
            <p className="break-all text-sm text-muted-foreground">Selected file: {file.name}</p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {uploading && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Uploading... {progress}%</p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || !file}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {uploading ? "Uploading..." : hasExistingSong ? "Replace Song" : "Upload Song"}
          </button>
        </div>
      )}
    </section>
  );
}
