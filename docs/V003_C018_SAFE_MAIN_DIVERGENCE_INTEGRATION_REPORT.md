# V003-C018 Safe Main Divergence Integration Report

## Result

`V003-C018 – SAFE MAIN DIVERGENCE INTEGRATION PASS, PUBLICATION GATE READY`

This cycle integrated the audited Git history from `origin/main` into `develop/V003`. It did not change application code, the accepted RC, the stable V003 artifact, or the annotated `V003` tag. No push or GitHub Release publication occurred.

## Locked release inputs

- Previous stable release commit: `ebc83281769fd212d988ee55957b1c2754256490`
- Local annotated `V003` tag target before and after: `ebc83281769fd212d988ee55957b1c2754256490`
- Stable artifact: `releases/V003/sPg Crafting List.html`
- Stable artifact before/after: `835820` bytes; SHA-256 `87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8`
- Accepted RC: `test-artifacts/V003-C015/fresh-release-candidate/sPg Crafting List V003 RC.html`
- Accepted RC SHA-256: `87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8`
- Stable artifact and accepted RC byte-identical: **YES**

## Fresh divergence audit

- Audited `origin/main`: `15ec5c149d1848c27a142e93932ef3dd238fc58b`
- Merge base: `5cc00939eba4dba8b5cc49ef5bf299eee7d1f3f9`
- Divergence: `12` remote-only / `44` local-only commits

Remote-only commits, oldest first:

1. `decf5941054d45332fc10b7f3f3597c6197d726b` — Delete index.html
2. `ef084a2b188563755673628640230f13220a9398` — Add files via upload
3. `bead28acb5c3df97633ec2b29e3e91869b412b58` — Delete index.html
4. `786afaafc45e4990603c00fd08edc7d46d690315` — Add files via upload
5. `7bab74f4123449047ec679105c2f57aaeef143e7` — Delete index.html
6. `2f5bae99a2a1c5f77dca619792bf3bb6a1530f5a` — Add files via upload
7. `b0d9333575a2b2b73bd1264d0e0b14427a4b96ff` — Delete index.html
8. `c4e52b0a8b960bf000280ae4a803c0367d369105` — Add files via upload
9. `e961abbaeb7e259a0f8c702599f283772282ddf1` — Delete index.html
10. `ca379cae67a40762e1854c13c238f875d93ad4ce` — Add files via upload
11. `0a2059ca6ba5b7fd24c08afb6f9bdf879e890d74` — Delete index.html
12. `15ec5c149d1848c27a142e93932ef3dd238fc58b` — Add files via upload

The remote-only final file delta was exactly `M index.html`. The remote side did not touch `sPg Crafting List.html`, `releases/V003/`, `test-artifacts/V003-C015/`, V001/V002 artifacts, release-gate documentation, or another application runtime file.

The local-only side contained `408` changed paths: `55` under `docs/`, `3` under `Info/`, `3` under `releases/`, `228` under `test-artifacts/`, `14` under `tests/`, `93` under `tools/`, and `12` root/other paths. The exact deterministic inventory is reproducible with `git diff --name-status 5cc00939eba4dba8b5cc49ef5bf299eee7d1f3f9..ebc83281769fd212d988ee55957b1c2754256490`. The local lineage had no `index.html` change relative to the merge base.

## Read-only merge simulation

- Command model: `git merge-tree --write-tree --messages <stable-release-commit> origin/main`
- Simulated merge tree: `c3eb6b3f816e6e7724ffecfa0be4b038b8efb5d3`
- `MERGE_CONFLICTS = 0`
- Content conflict: **NO**
- Rename/delete conflict: **NO**
- Destructive delete/rename in the simulated result: **NO**
- Simulated delta from the local parent: only `M index.html`
- Protected-path delta: **NONE**
- Resulting `index.html` blob: `cde287c59575f8585239a0b327c4221288a99475`, identical to current `origin/main:index.html`

## Integration commit

- Integration merge commit: `fafd669075287bf0eea59f6560ad2277d02f92be`
- First parent, V003 local lineage: `ebc83281769fd212d988ee55957b1c2754256490`
- Second parent, audited `origin/main`: `15ec5c149d1848c27a142e93932ef3dd238fc58b`
- Merge result relative to the first parent: only `M index.html`
- Application source/release logic change in this cycle: **NO**
- Remote landing page preserved: **PASS**

## Post-merge integrity

- `origin/main` is an ancestor of the integration commit: **PASS**
- Previous stable release commit is an ancestor of the integration commit: **PASS**
- `V003^{}` unchanged: **PASS**
- Stable V003 artifact SHA before/after: **PASS**
- Accepted RC SHA: **PASS**
- V001 integrity: **PASS**, SHA-256 `c422c4dabb3f60378de4a28c441ee8a79c9e180b8bf5853d46ab02a64a6ec259`
- V002 integrity: **PASS**, SHA-256 `de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357`
- Push: **NO**
- Force push: **NO**
- Main publication/merge: **NO**
- V003 tag push: **NO**
- GitHub Release: **NO**

## Rollback

Before publication, the integration is recoverable by reverting the merge commit with mainline parent 1. The stable V003 tag and artifact do not need to be moved or regenerated.
