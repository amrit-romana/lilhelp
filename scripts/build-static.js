/**
 * Build a static copy of the site into dist/.
 *
 * Same views and same assets as the Express app — only the routing changes:
 * "/what-it-does" becomes "what-it-does.html", and asset paths become
 * relative, so the output works from any static host or object store.
 */
import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const VIEWS = join(ROOT, 'views');
const DIST = join(ROOT, 'dist');

const PAGES = [
  { route: '/', file: 'index.html', view: 'home', nav: 'home',
    title: "lil' help — the assistant that learns how you work",
    description: "A desktop assistant for macOS that sits over your work, runs four conversations at once, remembers what you tell it, and says how sure it is." },
  { route: '/what-it-does', file: 'what-it-does.html', view: 'what-it-does', nav: 'what-it-does',
    title: "What it does — lil' help",
    description: 'Every surface, page and control: the presence bar, floating chat, the Inbox, all fifteen settings pages, calls and routines.' },
  { route: '/character', file: 'character.html', view: 'character', nav: 'character',
    title: "The character — lil' help",
    description: 'A ghost with only its legs visible. The state set, the panic meter, and why it goes still when the stakes are high.' },
  { route: '/download', file: 'download.html', view: 'download', nav: 'download',
    title: "Download — lil' help",
    description: 'Requirements, permissions and what happens the first time you open it.' }
];

/** Rewrite app routes and absolute asset paths for flat static hosting. */
function staticise(html) {
  return html
    .replace(/href="\/what-it-does"/g, 'href="what-it-does.html"')
    .replace(/href="\/character"/g, 'href="character.html"')
    .replace(/href="\/download"/g, 'href="download.html"')
    .replace(/href="\/"/g, 'href="index.html"')
    .replace(/href="\/css\//g, 'href="css/')
    .replace(/src="\/js\//g, 'src="js/')
    .replace(/href="\/favicon\.svg"/g, 'href="favicon.svg"');
}

const [layout] = await Promise.all([readFile(join(VIEWS, 'layout.html'), 'utf8')]);

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });
await cp(join(ROOT, 'public'), DIST, { recursive: true });

for (const page of PAGES) {
  const content = await readFile(join(VIEWS, `${page.view}.html`), 'utf8');
  const html = staticise(
    layout
      .replaceAll('{{TITLE}}', page.title)
      .replaceAll('{{DESCRIPTION}}', page.description)
      .replaceAll('{{NAV}}', page.nav)
      .replace('{{CONTENT}}', content)
      .replaceAll('{{YEAR}}', String(new Date().getFullYear()))
  );
  await writeFile(join(DIST, page.file), html, 'utf8');
  console.log('built', page.file);
}

console.log('\ndist/ ready — serve it with any static host.');
