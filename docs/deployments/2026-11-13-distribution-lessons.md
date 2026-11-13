# Distribution lesson release — 13 November 2026

## Read-only baseline

The live stats site was inspected before preparing the update. Its active static release was `20261113T105047Z-16f6fd8`; Caddy was active. All eight public-site and loopback health checks passed with HTTP 200. The active release and release directory are root-owned, so activation requires the owner's interactive sudo session under the infrastructure access policy.

## Change

The former distribution relationship explorer becomes a short overview and ten focused lessons. Connections start with random ingredients; derivations start with observations and a statistic. Numerical examples precede formal explanations, the family map and coordinate proofs are optional, step navigation follows the new heading, and homepage links are compact. Legacy shared links retain their settings.

The mathematical engine is unchanged. The release contains public static assets only; no service configuration, application data, containers, ports or certificates change.

## Verification and release procedure

Local verification passed: formatting and generated-page checks, all 55 unit tests, and all 524 browser tests across Chromium desktop/mobile, Firefox and WebKit. Browser coverage includes Chromium desktop/mobile, Firefox and WebKit, keyboard focus, 320px layouts, proof disclosures, state restoration, CSV exports and accessibility. Review desktop and mobile screenshots.

Build the release from the committed source, verify its SHA-256 manifest, and stage it with the guarded update script. Before activation, the script verifies the expected current release and existing service health, creates and verifies a restorable archive, then installs the new static assets. Activation atomically switches the current-release symlink; no service restart or downtime is expected.

After activation, verify all health checks and compare the deployed overview and ten lesson pages against the release manifest. The update script automatically restores the previous symlink if a post-activation check fails and leaves a root-owned rollback script and verified backup on the server.

Activation is a separate owner-operated step. Source publication or successful staging does not establish that the release is live.
