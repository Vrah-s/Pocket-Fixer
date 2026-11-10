# Pocket Workshop

A top-down, walk-around workshop game. The player explores the room, takes repair jobs from customers, uses workbenches, returns fixed items, and keeps the shift going without a final level.

## Controls

- **Computer:** Arrow keys or WASD to walk; press **E** to talk, use a workbench, or return a repaired item.
- **Phone/tablet:** Drag the on-screen joystick to walk; tap **Interact** when close to a customer or bench.
- **Respawn:** The button returns the player to the workshop entrance without losing the current job.

## Mission loop

1. Walk up to the customer with the `!` bubble and interact.
2. Take the item to the matching bench shown by the ring: cleaning, circuit, or gears.
3. Complete its short repair puzzle.
4. Carry the fixed item back to the customer and interact to finish the job.
5. Earn coins, then meet the next customer. Repair types rotate and puzzles become harder as the shift continues.

Progress and coins are saved in that browser on that device. The game is an installable Progressive Web App (PWA); after opening the hosted link online once, its files are cached for offline play.

## Play on your computer

1. Open a terminal in `/home/it/Desktop/Games/Pucket fixer/Pocket Workshop`.
2. Run `python3 -m http.server 8000`.
3. Open `http://localhost:8000` in a browser.

## Play on a phone

Publish the game over HTTPS and open its link on the phone while online once.

- **Android:** In Chrome, open the browser menu and choose **Install app** or **Add to Home screen**.
- **iPhone:** In Safari, tap **Share → Add to Home Screen → Add**. Open the saved icon once while online to cache the game.

## Publish online

For a quick manual upload, drag the **Pocket Workshop** folder to [Netlify Drop](https://app.netlify.com/drop). Netlify provides a public HTTPS link. For subsequent updates, drag the updated folder to the site's deploy page. [Netlify Drop instructions](https://docs.netlify.com/start/quickstarts/netlify-drop-quickstart/)

You can also publish for free with GitHub Pages from a public repository:

1. Create a public repository, for example `pocket-workshop`.
2. Upload the **contents** of this folder to the repository's top level (including `index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.webmanifest`, and `icon.svg`).
3. On the repository page, open **Settings → Pages**. If **Settings** is hidden on a narrow screen, check the `…` menu.
4. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/(root)`, then save. The `main` branch must exist first.
5. When deployment finishes, the Pages screen shows the public game link.

When publishing a new version, update the files in your host and increment `CACHE_NAME` in `sw.js` so installed copies replace their offline cache. The current cache is `pocket-workshop-v3`.

