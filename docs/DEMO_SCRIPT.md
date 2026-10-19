# MonumentStudio: final demonstration

The final walkthrough records the actual production application using only
fictional details. The finished take is silent, with readable captions below
the unmodified application frame. The narration below is a prepared script;
no voice recording or human consultation is claimed.

- [Captioned walkthrough](videos/sprint-e-workflow.mp4)
- [WebVTT captions](videos/sprint-e-workflow.vtt) and [SRT captions](videos/sprint-e-workflow.srt)
- [Capture metadata and cue timing](videos/sprint-e-capture.json)
- [Actual design PNG](../output/images/sprint-e-design.png),
  [summary PDF](../output/pdf/sprint-e-design-summary.pdf), and
  [preliminary proposal](../output/pdf/sprint-e-customer-proposal.pdf)
- [Editable design](../output/designs/sprint-e-design.json) and
  [export inspection](EXPORT_REVIEW.md)

The [76.04-second earlier recording](videos/sprint-c-workflow.webm) and the
earlier PNG/PDF examples remain unchanged as dated demonstration evidence.

## Completed recording and review

Recorded October 18, 2026, using Chromium `156.0.8078.4`. The actual MP4 is
**88.56 seconds**, `1440 × 1120`, H.264 at 25 frames per second, with no audio
stream. Its unmodified application frame is `1440 × 1000`; a separate
120-pixel band carries 11 readable caption cues. The timed workflow took
`84.0020129` seconds; context closure retained a short natural final-frame
tail. The closing caption continues through the complete recording.

The file is `1,951,726` bytes; SHA-256 is
`512a486ef5ddd401573ef9ab5a8826796f23573004b3941f578024fa4d5f4d30`.
The metadata also records the raw capture hash. FFmpeg decoded the entire
finished MP4 without errors. Sampled visual review covered every caption cue
and the warning, corrected lettering, refresh, restore confirmation,
restored quantities, download feedback, proposal, and final state. Captions
are contained in their band and do not cover the application. This is sampled
visual inspection, not a claim that every video frame was manually reviewed.

The recorder's real UI assertions passed for warning/recovery, independently
computed quantities, explicit Save/refresh/Open equality, the actual PNG's
pixel dimensions, downloaded PDFs, unchanged saved data after proposal use,
and a separate portable-file import. A further fresh-context UI download of
that portable design matched the saved document byte-for-byte. Runtime error
collection was empty.
[Export review](EXPORT_REVIEW.md) records inspection of the actual outputs,
all five rendered PDF pages, and the three responsive captures.

## Walkthrough and prepared narration

These rounded times describe the recorded workflow. Exact capture-relative
cue times are retained in the linked caption files and metadata. No steps are
sped up, no UI is composited, and no document images replace the application.

| Time | Actual action | Optional narration |
| --- | --- | --- |
| 0:00-0:04 | Show the initial designer. | “MonumentStudio turns physical dimensions and lettering into a reviewable memorial design.” |
| 0:04-0:09 | Choose an oval top; change height to 32 inches and thickness to 9 inches. | “Choose an oval top, then adjust its height and thickness.” |
| 0:09-0:19 | Type NORTH FAMILY, 1900 — 2000, and A life remembered. | “The name, dates, and epitaph are editable. All wording here is fictional.” |
| 0:19-0:25 | Move the name up 0.25 inches, then center it. | “Move the name in quarter-inch steps, then center it horizontally.” |
| 0:25-0:35 | Set the name to 8 inches to trigger a warning; restore 2.5 inches and verify it fits. | “Oversized text triggers a layout warning. Reducing it clears the warning. This remains a preliminary engraving guide.” |
| 0:35-0:43 | Open Design Review and inspect face area and volume. | “The same dimensions determine face area and solid volume. These estimates do not establish weight or manufacturing approval.” |
| 0:43-0:56 | Save explicitly, refresh to the default design, open the save, and confirm replacement. | “Save in this browser, refresh, and reopen. The shape, lettering, positions, and calculated values are restored.” |
| 0:56-1:03 | Open Download & Share and download the real PNG. | “Download a high-resolution drawing with front and side views.” |
| 1:03-1:09 | Download the design-summary PDF. | “The PDF carries the same dimensions, inscriptions, calculations, and limitations.” |
| 1:09-1:19 | Add fictional family reference and notes, then download the proposal. | “Optional notes support a preliminary proposal. It is not a quote, contract, or production approval.” |
| 1:19-1:28.56 | Clear temporary proposal details and return to the unchanged design; retain the actual closing frame. | “Editing, recovery, and documents share one design. Human review remains essential.” |

The final model is a `48 × 32 × 9 in` oval-top tablet with `8 in` rise on a
`60 × 8 × 14 in` rectangular base. Its analytical face area is
`1,453.592895 in²`; total nominal solid volume is `19,802.336053 in³`
(`11.459685 ft³`). The interface rounds its display; exported PDF tables retain
up to six decimal places. The fixed PNG is `3840 × 2440` pixels.

## Reproduce the captioned recording

Use a fresh automated browser context; do not record a customer session or
replace another person's saved design. The recorder creates and checks the
design through the actual UI and downloads real application files. It verifies
save/reopen equality, clear runtime logs, the warning/recovery sequence,
independently calculated area/volume, PNG pixel dimensions, and responsive
screenshots at 1440, 1024, and 390 pixels. Raw captures remain in ignored
`tmp/pdfs/release-demo-*` folders.

From the checkout containing `package.json`, start the production application:

```bash
npm ci
npm run build
npm start -- --hostname 127.0.0.1 --port 3000
```

In another terminal, run:

```bash
node scripts/record-release-demo.mjs
```

Use the reported `capture.json` path with FFmpeg (libx264 and libass enabled)
available on PATH, or set `FFMPEG_PATH` to its executable:

```bash
node scripts/encode-release-demo.mjs tmp/pdfs/release-demo-REPLACE/capture.json
```

The encoder rejects rehearsal pacing. It preserves the complete browser frame,
adds a 120-pixel caption band underneath, and produces H.264 MP4 plus WebVTT/SRT
sidecars. Captions describe observed actions and limitations. Audio is absent.
`DEMO_BASE_URL` can choose a different loopback port; non-loopback hosts are
rejected. `DEMO_PACE=0.1` is for rehearsal only, never a release take.

## Evidence boundaries

The video demonstrates software behavior with fictional data. It is not a
real consultant usability trial, customer approval, production authorization,
spoken screen-reader review, or proof of commercial adoption. Downloads are
triggered in the recording; their actual contents are reviewed separately in
[EXPORT_REVIEW.md](EXPORT_REVIEW.md). No downloaded document is substituted
into the browser footage. Physical print review remains pending.

## Reproducible silent browser capture

`scripts/record-demo.mjs` is a separate recording workflow, not narration for
the example above. It uses a fictional `NORTH FAMILY` inscription and a
`54.5 × 34.25 × 9.25 in` oval with `11.75 in` rise on a
`64.25 × 9.5 × 16.25 in` base. It demonstrates editing, placement, expanded
view, quantity review, Save/refresh/Open, and a real downloaded-file import.
The recorder verifies canonical file content and before/after drawing and
quantity equality. It captures the running app without synthetic screenshots
or composited UI; it supplies no audio or captions.

After installing dependencies and the bundled Chromium engine, run in one
terminal:

```bash
npm run build
npm run start -- --hostname 127.0.0.1 --port 3131
```

Then, from the same checkout in another terminal:

```bash
node scripts/record-demo.mjs
```

The script targets approximately 75 seconds. The October 12 recording measured
76.04 seconds at 1440 × 1000 pixels, encoded as VP9 in WebM (13,651,932 bytes).
All workflow assertions passed before the actual recording was copied to
`docs/videos/sprint-c-workflow.webm`. Extracted frames at 40 and 68 seconds were
visually inspected; this is sampled visual review, not a claim that every frame
was manually reviewed.
Raw recordings and the downloaded JSON remain in ignored `test-results/demo-*`
folders. The default target is loopback port 3131; `DEMO_BASE_URL` may select a
different loopback address. Do not aim the recorder at a live customer session.
The measurements above describe that October 12 recording; current software
checks are recorded separately in [VALIDATION.md](VALIDATION.md). Neither
recording establishes human usability, screen-reader behavior, or commercial use.
