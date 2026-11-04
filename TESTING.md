# Walking through Dream Builder

There is no backend yet, so sign-up and login accept any details — nothing is
sent anywhere. Data is kept in the browser's localStorage.

## Test account

| Field     | Value                  |
| --------- | ---------------------- |
| Full name | Test Parent            |
| Email     | parent@example.com     |
| Password  | DreamTest123 (any 8+ characters works) |

Tick both consent boxes on the sign-up page.

## Full journey, in order

Start fresh first: open the site in a private/incognito window, or click
**Sign out** on any parent page. If a "Preview mode" badge shows bottom-left,
click **Exit**.

1. `http://localhost:5173/` → **Create your account** (details above)
2. **Child profile configuration** → **Add Child**
   - Explorer flow: name `Alex`, age `8`
   - Creator flow: name `Maya`, age `14`
3. Select the child → **Ready for Handover** → **Hand Device & Begin**
4. **Start a New Story** → author name → format → art style
5. Hero → (Explorer: name + pronoun) → strength → (Explorer: helpful tools) → dream
6. Act 1: obstacle → feeling → brave move (Creator: one combined screen)
7. Rest & Restore → Act 2 → Challenge Gate
8. **Help Pip face it** (final act) or **Continue to the Ending**
9. Generating → cover → book reader → on the last page (15/15) **I'm Done!** → **Ask a Parent to Continue**
10. Parent review → **Confirm Story** → plans → payment (any card details) → order confirmation

To see the other mode, go to **Back to Child Profiles**, select the other child
and hand over again.

## Jump to any screen

`http://localhost:5173/screens` — load the Explorer or Creator demo, then open
any screen directly.

## Artwork

Images live in `frontend/src/assets/`, named by what they show (for example
`obstacles/roaring-fire.webp` or `heroes/knight/rest.webp`). Any slot without a
file shows a dashed placeholder; hero poses that are missing fall back to that
hero's standing image.

`http://localhost:5173/screens/assets` lists every expected file with ✅ / ❌.
To add one, save it under the listed path (WebP preferred, ideally under
~200 KB) — no code changes needed.
