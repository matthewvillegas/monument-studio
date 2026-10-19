/**
 * Add accurate captions below the actual Sprint E browser recording.
 * FFMPEG_PATH=/path/to/ffmpeg node scripts/encode-release-demo.mjs tmp/pdfs/release-demo-.../capture.json
 * Requires FFmpeg with libx264 and libass. No application pixels are replaced.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const manifestPath = path.resolve(process.argv[2] ?? "");
assert.ok(process.argv[2], "Pass the capture.json produced by record-release-demo.mjs.");
const capture = JSON.parse(await readFile(manifestPath, "utf8"));
assert.equal(capture.pace, 1, "A rehearsal is not a release recording.");
assert.ok(capture.duration >= 60 && capture.duration <= 90);
assert.deepEqual(capture.viewport, { width: 1440, height: 1000 });
const raw = path.join(path.dirname(manifestPath), "sprint-e-raw.webm");
const output = path.join(root, "docs/videos/sprint-e-workflow.mp4");
const ffmpeg = process.env.FFMPEG_PATH ?? "ffmpeg";
// Closing the recording context may retain a short natural final frame. Keep
// the closing caption visible for that real tail and report container timing.
function mediaDuration(filename) {
  const probe = spawnSync(ffmpeg, ["-hide_banner", "-i", filename], { encoding: "utf8" });
  const duration = probe.stderr?.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
  assert.ok(duration, "FFmpeg must report the recorded media duration.");
  return Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]);
}
const recordingSeconds = mediaDuration(raw);
assert.ok(recordingSeconds >= 60 && recordingSeconds <= 90);
const cues = capture.cues.map((cue, index) => ({
  start: index === 0 ? 0 : cue.start,
  end: capture.cues[index + 1]?.start ?? recordingSeconds,
  text: cue.text,
}));
function time(seconds, separator = ".", digits = 3) {
  const factor = 10 ** digits;
  const total = Math.round(seconds * factor);
  const fraction = String(total % factor).padStart(digits, "0");
  const whole = Math.floor(total / factor);
  return `${String(Math.floor(whole / 3600)).padStart(2, "0")}:${String(Math.floor(whole / 60) % 60).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}${separator}${fraction}`;
}
await writeFile(path.join(root, "docs/videos/sprint-e-workflow.vtt"),
  `WEBVTT\n\n${cues.map((cue) => `${time(cue.start)} --> ${time(cue.end)}\n${cue.text}\n`).join("\n")}`);
await writeFile(path.join(root, "docs/videos/sprint-e-workflow.srt"),
  cues.map((cue, index) => `${index + 1}\n${time(cue.start, ",")} --> ${time(cue.end, ",")}\n${cue.text}\n`).join("\n"));
const assPath = path.join(path.dirname(manifestPath), "captions.ass");
const ass = `[Script Info]
ScriptType: v4.00+
PlayResX: 1440
PlayResY: 1120
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Noto Sans,28,&H00F7F8FA,&H00F7F8FA,&H0017222D,&H0017222D,0,0,0,0,100,100,0,0,1,0,0,2,42,42,22,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${cues.map((cue) => `Dialogue: 0,${time(cue.start, ".", 2)},${time(cue.end, ".", 2)},Default,,0,0,0,,${cue.text.replaceAll("\n", "\\N")}`).join("\n")}
`;
await writeFile(assPath, ass);
const relativeAss = path.relative(root, assPath).split(path.sep).join("/");
assert.ok(!relativeAss.startsWith("..") && /^[a-zA-Z0-9_./-]+$/.test(relativeAss), "Keep the capture under tmp/pdfs.");
const encoded = spawnSync(ffmpeg, [
  "-hide_banner", "-y", "-i", raw,
  "-vf", `pad=1440:1120:0:0:color=0x17222d,subtitles=${relativeAss}:fontsdir=public/fonts`,
  "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-pix_fmt", "yuv420p", "-movflags", "+faststart", output,
], { cwd: root, stdio: "inherit" });
assert.equal(encoded.status, 0, "FFmpeg must complete successfully.");
assert.equal(mediaDuration(output), recordingSeconds, "Encoding must preserve recorded duration.");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const encodedBytes = await readFile(output);
await writeFile(path.join(root, "docs/videos/sprint-e-capture.json"), JSON.stringify({
  browser: capture.browser,
  sourceViewport: capture.viewport,
  outputPixels: { width: 1440, height: 1120 },
  workflowSeconds: capture.duration,
  recordingSeconds,
  audio: false,
  treatment: "Actual browser capture with a separate caption band; no replaced UI, synthetic frames, or voice recording.",
  encodedBytes: encodedBytes.length,
  encodedSha256: sha256(encodedBytes),
  rawSha256: sha256(await readFile(raw)),
  cues,
}, null, 2) + "\n");
console.log(`Encoded ${encodedBytes.length} bytes with ${cues.length} caption cues.`);
