# Human Workflow Study

**Status:** Ready to facilitate; no participant session or human
findings have been collected. This protocol is not evidence that the
application is intuitive. Automated demonstrations are separate evidence.

## Purpose and participants

Ask whether someone can create a memorial design, understand its preliminary
checks, and preserve the design without assistance. Begin with a monument
consultant; a later session with a person unfamiliar with design software can
test whether the wording works without industry knowledge. Record experience
without collecting unnecessary personal information. One session can identify
issues, not establish representative usability or commercial readiness.

Allow approximately 20–25 minutes as a **planning allowance**, not a measured
completion time. Offer breaks or stop immediately if the subject matter is
uncomfortable. Use fictional wording rather than a real person's memorial.

## Preparation and consent

- Run the production build and record the source snapshot, browser/version,
  operating system, screen size, zoom, and any assistive technology used.
- Use a separate demonstration browser profile with no saved customer design.
  Do not erase somebody else's save. Download a backup before an authorized
  replacement if a shared profile must be used.
- Explain: “We are testing the software, not you. Please say what you expect
  to happen. You can stop at any time. These are preliminary designs, not
  approved engraving or installation instructions.”
- Obtain permission before observing, recording a screen, or retaining quotes.
  Do not record names, private files, browser account information, or customer
  records. Use a participant code. Store notes outside the public repository
  until reviewed and anonymized with permission.
- Start from a fresh session. The application does not have a New Design
  button; opening a fresh page starts the default design. Do not imply that
  Reset to Default Size also resets the inscription or saved design.
- Confirm that the browser can download files and open the actual image/PDF
  downloads in a viewer. Keep a fictional example with supported PDF characters.
  Use a distinct download folder; do not expose unrelated files during a recording.
  Record a PDF viewer and its version if accessibility or print preview is tested.
- Use the task prompts below without demonstrating the solution first. Offer
  a hint only after recording where the participant became stuck. Record any
  hint and mark the task assisted; do not count it as unassisted completion.

## Task card

Give the participant this fictional request:

> Prepare an oval-top memorial with a 48-inch-wide, 30-inch-high,
> 8-inch-thick tablet. The curved top rises 8 inches. Its base is
> 60 inches wide, 8 inches high, and 14 inches deep. Use FAMILY NAME and
> 19XX — 20XX. Add “Always remembered” if you wish. Keep the design so it can
> be reopened here and transferred as a file. Produce an image and a PDF summary
> or preliminary proposal that another person could review. Use “Fictional
> consultation — demonstration only” for any optional proposal reference.

| Task | Neutral participant prompt | Facilitator observation |
| --- | --- | --- |
| 1. Begin | Start a fresh design without replacing someone else's work. | Understands a fresh session versus a saved design. |
| 2. Choose shape | Make this an oval-top monument. | Finds the shape control and understands cap rise. |
| 3. Set dimensions | Enter the requested tablet, base, and curved-top measurements. | Distinguishes thickness from base depth; sees front/side changes. |
| 4. Write text | Add the name and dates; optionally add the remembrance line. | Finds wording controls and sees the correct preview line. |
| 5. Place text | Move the name a little, then center it. Inspect it at a larger size. | Separates text content from placement; discovers expanded drawing; can close it. |
| 6. Interpret warnings | Move the name toward the top edge. What does the warning mean? Return it to a reasonable position. | Does not interpret the guide as verified engraving approval; can recover without losing text. |
| 7. Review | Find the overall dimensions and material quantities. What do these numbers tell you—and not tell you? | Understands volume is not weight or installation approval. |
| 8. Save | Keep this design in this browser. Where do you think it is stored? | Notices explicit save success and device/browser limits. |
| 9. Reopen | Reload the page and recover your saved design. | Uses Open Saved Design; recognizes replacement confirmation; compares shape/text. |
| 10. Transfer | Download the design file and open that actual file again. | Finds the file, understands confirmation, sees equivalent design. |
| 11. Image | Create a design image and open the downloaded file. Is everything needed to discuss the design visible? | Finds Download & Share; sees both elevations, dimensions, and inscriptions; distinguishes PNG from an editable design file. |
| 12. PDF | Create and open a design summary or preliminary proposal. Use fictional details only. | Finds the correct action; can read all pages; sees correct dimensions and preliminary notices; does not interpret a proposal as a price or approval. |
| 13. Proposal privacy | If a proposal was used, close and reopen its form. Where would you expect the entered notes to remain? | Understands notes clear from the form and are absent from the saved design but present in the downloaded PDF. Skip if only a summary was produced. |

Optional recovery prompts: enter a base width smaller than the tablet width,
then correct it; cancel a replacement dialog; import a supplied harmless
malformed JSON file. Check that the participant understands the existing
preview is preserved. Never ask them to upload private files.

For a keyboard session, repeat shape selection, a dimension correction, name
editing, button-based placement, expanded drawing, Save/Open, and dialog
cancellation, Download & Share, and proposal open/cancel using Tab, Shift+Tab,
Enter, arrows, and Escape. Record the actual
assistive-technology combination if one is used. Keyboard testing alone is not
screen-reader testing.

## Blank observation and feedback sheet

Session ID: ______  Date: ______  Facilitator: ______

Source snapshot: ______  Participant code/experience: ______

Browser/version: ______  OS: ______  Viewport/device: ______

Zoom/text scaling: ______  Input/assistive technology: ______

Consent and permitted recording/retention: ______

For each task, use **U** = completed unassisted, **A** = assisted,
**N** = not completed, **S** = skipped. Record an elapsed time only if actually
measured with the participant's agreement; leave blank otherwise.

| Task | U/A/N/S | Observed difficulty or error | Hint given | Time, if measured |
| --- | --- | --- | --- | --- |
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |
| 6 | | | | |
| 7 | | | | |
| 8 | | | | |
| 9 | | | | |
| 10 | | | | |
| 11 | | | | |
| 12 | | | | |
| 13 | | | | |

- Which words or measurements were confusing? ______
- Where was the next action difficult to find? ______
- Was the drawing or text hard to see? At what size or zoom? ______
- Did anything suggest a feature or approval the app does not provide? ______
- What did you expect Save, Download, and Import to do? ______
- Could you read the actual image/PDF at an ordinary viewing size? Record page,
  viewer, zoom, and any clipped or unclear content: ______
- What did you think the preliminary proposal permitted you to do? ______
- Where did you expect proposal notes to be stored? ______
- What error or warning was hardest to understand or recover from? ______
- What single change would most improve the experience? ______
- Optional verbatim quote, with permission and context: ______

## Acceptance checklist and follow-up

Check only after observing a real session; record assistance and failures.
Do not turn one participant's success into a population-wide usability claim.

- [ ] The participant completes shape, dimensions, wording, and placement tasks.
- [ ] The participant can explain a text warning and recover from it.
- [ ] The participant distinguishes nominal volume from weight/approval.
- [ ] The actual saved design is restored with matching dimensions and text.
- [ ] The participant opens and reads the actual PNG and PDF downloads.
- [ ] The participant distinguishes editable JSON, an image, and a PDF.
- [ ] Proposal privacy and preliminary status are understood when exercised.
- [ ] Keyboard/assistive-technology observations name the actual tools used.
- [ ] Only consented, anonymized observations are retained for public disclosure.

Physical printing: **pending unless actually performed**. Record printer,
paper size, scaling setting, and observed legibility if tested; print preview
alone is not a physical print trial. Do not claim calibrated manufacturing scale.

Keep observations, participant statements, and facilitator interpretations
separate. For each finding, record the task, observed evidence, severity,
proposed change, and a reproduction or follow-up check. Prioritize lost work,
misunderstood engineering limitations, inaccessible controls, and blocked tasks
above visual preferences. Retest substantive fixes with consent.

**Results: pending.** No completion rate, participant quote, time saving,
customer satisfaction, or business outcome is claimed. Add anonymized results
only after a real session, with approval to retain and disclose them. Link the
executed record from [VALIDATION.md](VALIDATION.md) rather than
retroactively treating this plan as evidence.
