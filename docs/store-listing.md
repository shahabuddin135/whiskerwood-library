# Google Play store listing: Whiskerwood Library

Copy these into the **Play Console → Grow → Store presence → Main store listing**. The graphics are in `docs/store/`, and you can regenerate them with `npm run store-assets`.

## App name (≤ 30 characters)
```
Whiskerwood Library: Cozy Idle
```

## Short description (≤ 80 characters)
```
Run a cozy mouse library! Build floors, collect books & greet royal guests.
```

## Full description (≤ 4000 characters)
```
Grandma Mimsy has left you her tiny library in the meadow, and the mice of Whiskerwood can't wait to read!

📚 GROW A COZY LIBRARY
Every mouse who reads drops a coin in the jar. Tap the jar, then spend your coins on armchairs, bookshelves, lamps and rugs. Upgrade the book collection for ×2 income milestones, and watch the shelves fill up with books.

🏛️ BUILD TEN MAGICAL FLOORS
Stack new floors on your library: Storybook Corner, Tea & Crumbs Café, the Adventure Map Room, a spooky Mystery Attic, a Poetry Greenhouse, the Stargazer Observatory, the Royal Archive, the Moonlit Music Hall and the Grand Atrium. Each one has its own look, furniture and five books to collect.

⭐ CELEBRITIES, AUTHORS & ROYALTY
Tap glowing guests before they leave! Celebrities bring fans, authors sign books for your album, and Queen Mozzarella herself may issue a Royal Decree.

🐱 CAT ALERT!
Baroness Clawdia, the biggest cat in the meadow, loves to peek through the windows. Tap her until she runs away! You'll also squish bookworms, catch Sneaky Rattigan before he steals your coins, find lost books, and impress the fussy critic Monsieur Fromage.

📖 A STORY THAT GROWS WITH YOU
Discover Grandma Mimsy's hidden letters, the legend of the Golden Crumb, and what Clawdia really wants.

🌸 SEASONS, WEATHER & LIFE
Spring blossoms, summer sunflowers, autumn leaves and winter snow. Rainy days bring more readers, rainbows appear after the storm, and fireflies come out at night. Tap the fishing mouse, hot-air balloons and shooting stars for surprises.

🎯 ALWAYS SOMETHING TO DO
Quick tasks with a reward chest, story quests, daily gifts, a lucky wheel, a 50-book album, reputation levels and Story Hour boosts.

🌿 OPEN NEW BRANCHES
Move your library to Windmill Hill, Lighthouse Cove, Willow Pond and Moonlit Castle, and earn Golden Quills that make every future library stronger.

🎵 A GENTLE, ORIGINAL SOUNDTRACK
A hand-composed waltz with piano, music box and flute, plus a soft nocturne at night.

✨ Cozy, relaxing and perfect for short breaks
✨ Keeps earning while you're away
✨ Pinch to zoom in on every little reader
✨ Plays offline

Open the doors, and happy reading! 🐭
```

## Category & tags
- **App category:** Game → Simulation (Casual also fits)
- **Tags:** Idle, Tycoon, Cozy, Casual, Simulation, Offline, Single player

## Graphics (in `docs/store/`)
| Asset | File | Play requirement |
|---|---|---|
| App icon | `public/icon-512.png` | 512×512 PNG |
| Feature graphic | `docs/store/feature-graphic.png` | 1024×500 |
| Phone screenshots | `docs/store/screenshot-*.png` | 2–8 images, 1080×1920 |

## Release notes (v1.1.0)
```
🐱 Baroness Clawdia arrives! Shoo her away from the windows
📚 Books now appear as you level up, with a 50-book album
🔍 Pinch to zoom, bookworms, lost books, a coin thief and a food critic
🌸 Seasons, weather, rainbows and lots more life around the library
💬 Chatty mice, a story with Grandma Mimsy, and quick tasks with reward chests
```

---

# Play Console questionnaires (suggested answers)

Check each answer against the current Play Console wording before you submit.

### App content → Ads
**Contains ads: Yes** (Google AdMob).

### App content → Target audience and content
- **Target age groups: 13–15, 16–17, 18+.** This is recommended. If you include under-13 age groups, you must follow the *Families Policy*: use only Families-certified ad setups and mark ad requests as child-directed (`tagForChildDirectedTreatment`).
- **Appeals to children:** the art is cute, but the game is designed for a general audience.

### App content → Content rating (IARC)
- Category: **Game**
- Violence: **No** (a cartoon cat is shooed away; nobody is hurt)
- Fear / horror: No · Sexuality: No · Language: No · Controlled substances: No
- **Gambling / simulated gambling:** a "Lucky Wheel" gives in-game rewards only. It cannot be paid for with real money and pays out no cash. Answer the questions on this accordingly.
- User interaction / chat: No · Shares location: No · Digital purchases: only if you enable IAP

### App content → Data safety
The game has no accounts and saves progress only on the device. **Google AdMob** collects the following:

| Data type | Collected | Shared | Purpose |
|---|---|---|---|
| Device or other IDs (Advertising ID) | Yes | Yes (Google) | Advertising, analytics, fraud prevention |
| Approximate location (from IP) | Yes | Yes (Google) | Advertising, fraud prevention |
| App interactions | Yes | Yes (Google) | Advertising, analytics |
| Crash logs / diagnostics | Yes | Yes (Google) | Analytics |

- Data is encrypted in transit: **Yes**
- Users can request deletion: game data stays on the device (Reset progress or uninstall). Ad data is controlled through Google's settings.
- Collection is required for ads. Personalised ads are optional where consent applies.

### App content → Other declarations
- Privacy policy URL: host `docs/privacy-policy.html` (for example on GitHub Pages) and paste the link. Put the same URL in `src/config.js → privacyUrl`.
- App access: **All functionality available without special access**
- Government / financial / health / news app: **No**
- Advertising ID: **Yes, the app uses it** (for AdMob; the `AD_ID` permission is declared)
