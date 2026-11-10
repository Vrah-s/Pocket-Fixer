# Pocket Workshop

A cozy mobile-first endless repair game that runs in a web browser. Customers keep arriving, the repair puzzles gain new variations and difficulty, and the game saves progress on the device. It is a Progressive Web App (PWA), so players can add it to their home screen and play offline after the first successful load.

## Play on your computer

1. Open a terminal in `/home/it/Desktop/Games/Pucket fixer/Pocket Workshop`.
2. Run `python3 -m http.server 8000`.
3. Open `http://localhost:8000` in a browser.

The local server is needed for the browser's offline app support. Opening `index.html` directly as a file lets you try the game, but does not enable its offline cache.

## Play on a phone

Publish the game over HTTPS first (either hosting option below), then open its link on the phone while online once. The game caches its files for offline use.

- **Android:** Open the link in Chrome and choose **Install app** or **Add to Home screen** from the browser menu.
- **iPhone:** Open the link in Safari, tap **Share**, choose **Add to Home Screen**, then tap **Add**. Open the saved icon once while online so the cache is ready.

Tap the next customer card to start a repair. Rub the object to clear its dusty spots, connect matching colored wires, or turn a gear to its marked angle. Finish the job to earn coins and welcome the next customer. There is no final level; puzzle variations get harder as your shift continues. Progress and coins are saved in that browser on that device. The music-note button turns sound on or off.

## Quick publish with Netlify Drop

This avoids GitHub repository settings. Sign in or make a free Netlify account, open [Netlify Drop](https://app.netlify.com/drop), and drag the **Pocket Workshop** folder from your computer onto the page. Netlify publishes it and gives you a public HTTPS link. Share that link with players. For later changes, drag the updated **Pocket Workshop** folder onto the site's deploy page. Netlify's docs describe this manual folder upload flow. [Netlify Drop guide](https://docs.netlify.com/start/quickstarts/netlify-drop-quickstart/)

## Publish with GitHub Pages

GitHub Pages hosts static HTML, CSS, and JavaScript files for free from a public GitHub repository.

1. Create or sign in to a GitHub account.
2. Create a **public** repository, for example `pocket-workshop`.
3. Upload the *contents* of the `Pocket Workshop` folder to the repository's top level: `index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.webmanifest`, and `icon.svg` (the README can be uploaded too). Do not upload the enclosing `Pocket Workshop` folder, or Pages will not find `index.html` at the site root.
4. Open the repository page on GitHub in a browser. Under the repository name, find the top tabs and click **Settings**. On a narrow screen, **Settings** may be inside the `…` menu. This is a GitHub website setting, not a setting in the computer folder.
5. In the left sidebar, under **Code and automation**, click **Pages**. Under **Build and deployment**, set **Source** to **Deploy from a branch**, select the `main` branch and `/ (root)`, then click **Save**. GitHub requires the selected branch to exist; if the branch menu says **None**, upload/commit the files first. You need repository admin or maintainer permission to change this setting. [GitHub's Pages instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
6. Wait for the Pages deployment to finish. The link will look like `https://YOUR-USERNAME.github.io/pocket-workshop/`.
7. Open that link on a phone and follow the install steps above.

When you update the game, upload the changed files and increment `CACHE_NAME` in `sw.js` (for example, from `pocket-workshop-v2` to `pocket-workshop-v3`) so installed copies refresh their offline files.

## Project files

- `index.html` — game screens and workshop illustration
- `styles.css` — mobile-first layout and visual style
- `app.js` — repair puzzles, sound, and local progress
- `sw.js` — offline cache
- `manifest.webmanifest` and `icon.svg` — home-screen app details

