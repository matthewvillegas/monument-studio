# Design Documents and Local Recovery

The version-1 document is the complete saved-design format. This contract is
separate from the illustrative, dimension-only `MonumentDesignV1` helper type.
That helper is not a complete save of the application and is not migrated or
accepted as one.

## Version 1

```json
{
  "format": "monumentstudio-design",
  "schemaVersion": 1,
  "units": "in",
  "profile": { "kind": "upright-oval", "capRiseIn": 8 },
  "dimensions": {
    "tablet": { "width": 48, "height": 30, "thickness": 8 },
    "base": { "width": 60, "height": 8, "depth": 14 }
  },
  "inscriptions": [
    { "id": "name", "content": "FAMILY NAME", "xIn": 24, "yIn": 12, "fontSizeIn": 2.5 },
    { "id": "dates", "content": "19XX — 20XX", "xIn": 24, "yIn": 17.4, "fontSizeIn": 1.15 },
    { "id": "epitaph", "content": "", "xIn": 24, "yIn": 22.8, "fontSizeIn": 1 }
  ]
}
```

For a straight top, `profile` is exactly `{ "kind": "upright-straight" }`;
there is no unused cap field. All three inscription IDs are required exactly
once. An empty epitaph means it is not displayed; its coordinates and font
size are still preserved. Strings are text, not HTML.

Dimensions and inscription coordinates are canonical IEEE-754 JavaScript
numbers expressed in inches. JSON preserves those supported numeric values;
it is not a decimal-arithmetic or manufacturing-tolerance guarantee. The
tablet-local origin is the upper-left of its bounding rectangle, including
the oval's empty top corners. X increases rightward; Y increases downward.
`xIn` is the horizontal center anchor; `yIn` is the text baseline.
`fontSizeIn` is an em-square size, not measured letter height.

Version 1 uses the application's fixed serif text presentation and sample
granite preview. No selectable material, font family, rotation, or alignment
option currently exists to persist. A future change to a saved rendering
choice must have an explicit backward-compatibility decision; do not silently
reinterpret old coordinates or anchors.

## Deliberate exclusions

The document contains no canvas or SVG pixel coordinates, viewport size,
selection, hover, open panel, guide visibility, browser text measurements,
React state, error messages, invalid drafts, or calculated area/volume.
Geometry, common front/side scaling, text bounds, guide warnings, and nominal
quantities are recalculated after loading. Numeric display rounding is not
saved. The model preserves design intent, not a screenshot or UI session.

## Validation boundary

`lib/persistence/document.ts` owns the strict Zod envelope and parsing and
serialization boundary. It reuses the existing dimension, profile, and
inscription contracts rather than implementing a competing geometry validator.

- The format, supported schema version, and inch unit are mandatory.
- Unknown properties are rejected at every modeled object. Added calculated
  values are rejected, not trusted as engineering inputs.
- Dimensions must be finite numbers within established technical guards;
  the base must be at least as wide/deep as the tablet's width/thickness.
- Oval rise must be finite and obey `0 < R ≤ tablet height`.
- Each of `name`, `dates`, and `epitaph` occurs once, with bounded single-line
  text, finite coordinates in `[-240, 240] in`, and font size in `[0.25, 12] in`.
- Malformed JSON, missing fields, stringified numbers, duplicate inscription
  IDs, unsupported versions, and unexpectedly structured data are rejected.
- An iterative structural guard explicitly rejects prototype-related keys,
  non-JSON prototypes, accessor properties, symbols, non-enumerable fields,
  and cyclic structures before the ordinary schema. It does not execute
  getters or recursively walk hostile nesting. Strict Zod alone was found to
  ignore an own `__proto__` key in a tested path, so the boundary does not
  rely on that behavior to reject unexpected input. Import never evaluates
  code, merges arbitrary objects into state, or injects HTML.
- Input is limited to 64 KiB (65,536 UTF-8 bytes); the file's size is checked
  before reading and the parser enforces its own byte limit.

Layout warnings are not serialization errors. A document may deliberately
contain blank required text, overlap, or text outside the face while being
edited; loading preserves that content and recalculates warnings. These are
not engraving-approved designs. Conversely, invalid numeric drafts cannot be
saved merely by serializing the last-valid preview behind them.

The reducer validates again before atomically replacing the canonical model.
An invalid import leaves the current design and its pending edits unchanged.
No partial assignment, numeric coercion, coordinate clamping, or automatic
centering occurs on load. Asynchronous file reading does not grant permission
to discard a newer edit: replacement is confirmed against the current work.

## Browser-local saving

`lib/persistence/storage.ts` manages one explicit browser-local slot under
`monumentstudio.saved-design.v1`. The user saves or opens it deliberately;
there is no autosave, automatic restore, cloud service, user account, or sync.

Storage is scoped to the browser profile and origin (including protocol,
host, and port). A save on one development port is not a save on another.
Private browsing, blocked storage, browser-data clearing, another browser, or
another device can make it unavailable. Download a design file for a portable
backup; local storage and JSON files are not encrypted customer-record storage.

The adapter distinguishes a missing save, malformed/unsupported saved data,
unavailable storage, capacity failures, and a changed slot. It catches access
and write errors and does not claim success after a failed write. Replacing
an existing save is a separate confirmation from replacing the current design.

Before a confirmed write, the adapter rereads the raw slot and compares it
with the expected previous value. A changed slot requires a new action instead
of knowingly overwriting another tab's saved work. This is **not** a database
transaction: `localStorage` has no compare-and-swap primitive, so a very small
read/write interleaving window remains across tabs. Simultaneous editing is
not a collaboration feature or a guaranteed conflict-free workflow.

Unsaved work is shown in the interface; replacing it requires confirmation.
A browser `beforeunload` prompt is best effort and browser-controlled, not
an autosave guarantee. Downloading requests a browser download; the application
cannot prove that the user retained the file on disk.

## Migration strategy

Only complete version-1 documents are accepted. Unknown future or legacy
versions are rejected with understandable feedback while preserving the current
design. No migration code is needed or claimed for formats never supported.

For a future version, retain its explicit input schema, validate the original,
transform through a pure tested migration, and validate the resulting current
document before applying it. Preserve inch units, center/baseline anchors, and
the original file; never infer missing inscriptions or silently change a
geometric meaning. Add independent round-trip and derived-quantity regression
cases for every supported migration.

See [persistence architecture](architecture.md#persistence) for component
ownership and [VALIDATION.md](VALIDATION.md) for executed checks and remaining
evidence gaps.
