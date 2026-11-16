# Mitti Sentinel — Phase 1 build

## Goal
Replace the starter screen with a polished, standalone Mitti Sentinel experience that clearly separates demo data from real field data and preserves the uploaded four-phase handoff.

## Build
- Create a responsive, dark earthy dashboard with a short landing introduction, a dominant field-map area, an animated soil-moisture dial, a clear recommendation with language selector and farmer confirmation, field health, decision history, and a visible data-source trust strip.
- Make demo readings and recommendation changes vary over time. Label the sample location, sensor readings, satellite/NDVI preview, and forecasts honestly; do not imply a real sensor, live imagery, a certified agronomy model, or irrigation control is connected.
- Add `specs.md` describing each built screen/component, the planned future data shapes and backend contracts, all Phase 1 placeholders, and the open details required before real sensor/satellite wiring.
- Add focused tests for the mock decision behavior and missing/stale-data safeguards, plus `TESTING.md` recording only checks actually run and clearly marking later-phase real-device, satellite, and deployment checks unverified.
- Update the project design tokens, page-specific metadata, and root architecture guidance; run relevant tests and verify the narrow-screen view; commit the completed changes.

## Later phases
Do not provision Cloud, invent sensor protocols/coordinates, claim real satellite access, add database policies, deploy, or run live-data tests in this Phase 1 build. Those require the actual plot coordinates, sensor interface, and service credentials / account access.
