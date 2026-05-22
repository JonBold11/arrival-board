# Arrival Board

Arrival Board is a static, landscape-first countdown display designed for an always-on tablet.
It uses plain HTML, CSS, and JavaScript only, with no backend, no APIs, and no frameworks.

The design is inspired by vintage train/airport arrival boards:
- dark industrial background
- amber split-flap style ETA
- red ticker broadcast messages
- day/night visual mode for lower-light use

## Files

- `index.html` - display structure
- `style.css` - board visuals, responsive layout, animation, day/night themes
- `script.js` - countdown logic, ticker, fullscreen, reload reliability behavior

## Set The Due Date

Open `script.js` and update the `DUE_DATE` constant near the top:

```js
var DUE_DATE = new Date(2026, 11, 18, 0, 0, 0, 0);
```

This is local-time midnight by default (`year, monthIndex, day, ...`).
Example: month index `0` is January, `1` is February, etc.

## Local Testing

From inside the `arrival-board` directory, run:

```bash
python3 -m http.server 8000
```

Open on the development machine:

- `http://localhost:8000`

To test on the tablet:

1. Make sure the tablet and laptop are on the same Wi-Fi.
2. Find the laptop's local IP address.
3. Open this on the tablet:
   - `http://LAPTOP_LOCAL_IP:8000`

This local server setup is only for testing. GitHub Pages should be used for the final hosted version.

## GitHub Pages Deployment

1. Commit the project.
2. Push to GitHub.
3. Enable GitHub Pages from repository settings.
4. Serve from the main branch root.
5. Final URL should look like:
   - `https://USERNAME.github.io/arrival-board/`

## Tablet Setup Notes

- Keep the tablet plugged in.
- Enable Android developer option **Stay awake while charging**.
- Use landscape orientation.
- Tap `ARRIVALS` (or `ENTER STATION MODE`) to attempt fullscreen.
- If fullscreen is blocked by the browser, the board still runs normally.
- Tested target: old Android tablet browser. If animations stutter, enable reduced motion or use lighter animation mode.

## Reliability Features Included

- Calendar-accurate month/day countdown (not `days / 30`)
- Floor days remaining
- Arrived fallback state (`ARRIVED`, `STATUS: ARRIVED`, `0`)
- Day mode: 8:00 AM to 7:59 PM
- Night mode: 8:00 PM to 7:59 AM
- Slow transition between day/night styles
- Burn-in drift every 5 to 10 minutes using `transform: translate(...)`
- Nightly reload once per calendar day after 3:00 AM (guarded by `localStorage`)
- Reduced-motion support with `prefers-reduced-motion`

## Notes For Testing

- Verify no scrolling in landscape.
- Verify portrait shows `ROTATE DEVICE FOR ARRIVAL BOARD`.
- Verify fullscreen tap works where supported and fails gracefully where not.
- Verify countdown is positive and stable before due date.
- For day/night testing, temporarily change device time.

## Future Enhancements (Not Included In v1)

- Optional PWA (`manifest.json`, `service-worker.js`)
- Add-to-home-screen install behavior
- Expanded offline caching control
