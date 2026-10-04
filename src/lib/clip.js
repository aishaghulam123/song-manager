// Helpers for playing only PART of a song.
// Cloudinary can trim audio while delivering it: ".../upload/so_30,eo_60/v123/file.mp3"
//   so = start offset, eo = end offset (both in seconds).
// The full file stays stored, so the clip can be changed later without re-uploading.

const roundSeconds = (n) => Number(Number(n).toFixed(2));

// Accepts "", "75", "75.5", "1:15" or "1:15.5".
// Returns seconds (number), null (empty box) or NaN (invalid text).
export function parseTime(text) {
  const value = String(text ?? "").trim();
  if (value === "") return null;
  const match = value.match(/^(?:(\d+):)?(\d+(?:\.\d+)?)$/);
  if (!match) return Number.NaN;
  const minutes = match[1] ? Number(match[1]) : 0;
  const seconds = Number(match[2]);
  if (match[1] && seconds >= 60) return Number.NaN;
  return minutes * 60 + seconds;
}

// 75.5 -> "1:15.5", 30 -> "0:30", null -> ""
export function formatTime(seconds) {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return "";
  const total = Math.round(seconds * 10) / 10;
  const minutes = Math.floor(total / 60);
  const rest = Math.round((total - minutes * 60) * 10) / 10;
  const restText = Number.isInteger(rest) ? String(rest) : rest.toFixed(1);
  return `${minutes}:${rest < 10 ? "0" : ""}${restText}`;
}

// Checks the two text boxes. `duration` (seconds) is optional and only used for a sanity check.
export function validateClip(startText, endText, duration) {
  const start = parseTime(startText);
  const end = parseTime(endText);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return { start: null, end: null, error: "Use seconds (e.g. 75) or minutes:seconds (e.g. 1:15)." };
  }
  if (start !== null && end !== null && end - start < 1) {
    return { start: null, end: null, error: "The end must be at least 1 second after the start." };
  }
  if (duration && start !== null && start >= duration) {
    return {
      start: null,
      end: null,
      error: `The start is beyond the end of the song (${formatTime(duration)}).`,
    };
  }
  return { start, end, error: "" };
}

// Turns the full Cloudinary URL into a URL that plays only start..end.
// With no start and no end the full URL is returned unchanged.
export function buildClipUrl(originalUrl, start, end) {
  const parts = [];
  if (typeof start === "number" && start > 0) parts.push(`so_${roundSeconds(start)}`);
  if (typeof end === "number") parts.push(`eo_${roundSeconds(end)}`);
  if (parts.length === 0) return originalUrl;

  const marker = "/upload/";
  const index = originalUrl.indexOf(marker);
  if (index === -1) return originalUrl;
  const cut = index + marker.length;
  return `${originalUrl.slice(0, cut)}${parts.join(",")}/${originalUrl.slice(cut)}`;
}
