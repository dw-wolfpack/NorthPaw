# Content art (Midjourney → NorthPaw)

Drop exports here and keep the **same filenames** so the app picks them up without code changes.

## Filenames

| File | Where it shows | Suggested brief |
|------|----------------|-----------------|
| `home-hero.png` | Library tab top banner | Dog + trail / NorCal ridgeline, wide **3:1 or 16:9** |
| `pack-placeholder.png` | Pack rows + pack screen hero until per-pack art exists | Generic trail ready / dog + pack, **4:3** |
| `card-placeholder.png` | Field card hero until per-card art exists | Trail safety vibe, **4:3** |

## Optional later (not wired yet, add `card-{id}.png` and extend `lib/contentVisuals.ts`)

- Per-card: `card-heat-stress-signals.png`, etc. (match card `id` from `library.json`)
- Per-pack: `pack-trail-basics.png`, `pack-norcal-seasons.png`

## Export tips

- **~1200px** wide minimum for heroes; PNG or WebP.
- Leave a little **empty sky or trail** at the bottom third for overlaid white text.
