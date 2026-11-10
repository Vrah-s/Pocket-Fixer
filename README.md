# Pocket Workshop

A cozy mobile-first repair game that runs in a web browser. It is built as a Progressive Web App (PWA), so players can add it to their home screen and play offline after the first successful load.

## Play on your computer

1. Open a terminal in this folder.
2. Run `python3 -m http.server 8000`.
3. Open `http://localhost:8000` in a browser.

The local server is needed for the browser's offline app support. Opening `index.html` directly as a file lets you try the game, but does not enable its offline cache.

## Play on a phone

Publish the game over HTTPS first (the free GitHub Pages instructions are below), then open its link on the phone while online once. The game caches its files for offline use.

- **Android:** Open the link in Chrome and choose **Install app** or **Add to Home screen** from the browser menu.
- **iPhone:** Open the link in Safari, tap **Share**, choose **Add to Home Screen**, then tap **Add**. Open the saved icon once while online so the cache is ready.

Touch the job cards to choose a repair. For the toy and flowerpot, rub the object to clear every dusty spot. For the radio and bicycle, tap a colored wire, then the same color socket. For the clock, turn the gear until it reaches 90°. Tap **Looks good!** to finish. Progress and coins are saved in that browser on that device. The music-note button turns sound on or off.

## Publish online for free with GitHub Pages

GitHub Pages hosts static HTML, CSS, and JavaScript files for free from a public GitHub repository.

1. Create or sign in to a GitHub account.
2. Create a **public** repository, for example `pocket-workshop`.
3. Upload the files in this folder to the repository's top level: `index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.webmanifest`, and `icon.svg` (the README can be uploaded too).
4. In the repository, open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**, select the `main` branch and `/ (root)`, then save.
6. Wait for the Pages deployment to finish. The link will look like `https://YOUR-USERNAME.github.io/pocket-workshop/`.
7. Open that link on a phone and follow the install steps above.

When you update the game, upload the changed files and increment `CACHE_NAME` in `sw.js` (for example, from `pocket-workshop-v1` to `pocket-workshop-v2`) so installed copies refresh their offline files.

## Project files

- `index.html` — game screens and workshop illustration
- `styles.css` — mobile-first layout and visual style
- `app.js` — repair puzzles, sound, and local progress
- `sw.js` — offline cache
- `manifest.webmanifest` and `icon.svg` — home-screen app details

