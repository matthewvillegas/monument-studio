# MonumentStudio: Mathematics Applied to Memorial Design

**Problem:** Visualizing and revising a dimensionally accurate memorial requires
the shape, lettering, and material quantities to remain consistent.

**Motivation:** Practical design and consultation needs identified through
Villegas Headstones & Monuments LLC connect this project to physical objects
and the people discussing them.

**Solution:** An interactive straight/oval-top designer combines parametric
geometry, inscription editing, preliminary analysis, browser-local saving,
portable design files, high-resolution PNGs, PDF summaries, and proposals.

**Technical approach:** Inches are canonical. Shared coordinate transformations
produce proportional front/side elevations. For width `W`, height `H`, and cap
rise `R`, oval face area is `W(H−R) + πWR/4`; multiplying by uniform thickness
gives nominal tablet volume. Strict versioned serialization preserves inputs;
reusable rendering and fresh text measurement generate outputs.

**Engineering challenges:** Browser text measurements differ, so lettering
bounds are recomputed instead of saved. Curved-face checks exclude the oval's
empty corners. A reduced-motion transition caused stale lettering warnings;
disabling it restored fresh measurement, checked by a three-browser regression.

**Validation:** October 18 checks passed 185 unit tests, 118 browser cases,
lint, strict types, and the production build; two screenshot-only skips were
intentional. Independent analytical references, actual downloads, parsed PDFs,
keyboard checks, and axe scans support these results. [The evidence](VALIDATION.md)
records their limits; human consultation and spoken screen-reader review remain
unperformed.

**Outcome:** The demonstrated workflow takes measurements and fictional
inscriptions through revision, recovery, and shareable preliminary documents.
No customer adoption, revenue, productivity gain, or production approval is claimed.

**My Contribution:** I directed the product requirements, supplied
monument-industry context, and defined the portfolio goals.

**Limitations:** Calculations assume ideal constant-thickness solids, not
verified manufacturing rules. Guides are preliminary; volume is not weight.
PDF language/accessibility and browser-local persistence have explicit limits.

**Future work:** Evaluate 3D visualization and commercial workflow expansion
after human review and manufacturing assumptions are established.

[Designer and sample outputs](../README.md) ·
[Engineering methods](ENGINEERING_METHODS.md) ·
[Demonstration](DEMO_SCRIPT.md)

*Applying mathematics and computation to design and improve physical systems.*
