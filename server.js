import express from 'express';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VIEWS = join(__dirname, 'views');
const PUBLIC = join(__dirname, 'public');
const PORT = process.env.PORT || 3000;

const DEV = process.env.NODE_ENV !== 'production';

/**
 * Pages are plain HTML fragments composed into a shared layout at request
 * time. In production each composed page is cached; in development the files
 * are re-read on every request so edits show up on refresh.
 */
const PAGES = {
  '/': {
    view: 'home',
    title: "lil' help — the assistant that learns how you work",
    description:
      "A desktop assistant for macOS that sits over your work, runs four conversations at once, remembers what you tell it, and says how sure it is.",
    nav: 'home'
  },
  '/what-it-does': {
    view: 'what-it-does',
    title: "What it does — lil' help",
    description:
      'Every surface, page and control: the presence bar, floating chat, the Inbox, all fifteen settings pages, calls and routines.',
    nav: 'what-it-does'
  },
  '/character': {
    view: 'character',
    title: "The character — lil' help",
    description:
      'A ghost with only its legs visible. The state set, the panic meter, and why it goes still when the stakes are high.',
    nav: 'character'
  },
  '/download': {
    view: 'download',
    title: "Download — lil' help",
    description: 'Requirements, permissions and what happens the first time you open it.',
    nav: 'download'
  }
};

const cache = new Map();

async function render(route) {
  if (!DEV && cache.has(route)) return cache.get(route);

  const page = PAGES[route];
  const [layout, content] = await Promise.all([
    readFile(join(VIEWS, 'layout.html'), 'utf8'),
    readFile(join(VIEWS, `${page.view}.html`), 'utf8')
  ]);

  const html = layout
    .replaceAll('{{TITLE}}', page.title)
    .replaceAll('{{DESCRIPTION}}', page.description)
    .replaceAll('{{NAV}}', page.nav)
    .replace('{{CONTENT}}', content)
    .replaceAll('{{YEAR}}', String(new Date().getFullYear()));

  if (!DEV) cache.set(route, html);
  return html;
}

const app = express();
app.disable('x-powered-by');

app.use(
  express.static(PUBLIC, {
    maxAge: DEV ? 0 : '1h',
    etag: true
  })
);

for (const route of Object.keys(PAGES)) {
  app.get(route, async (_req, res, next) => {
    try {
      res.type('html').send(await render(route));
    } catch (err) {
      next(err);
    }
  });
}

app.use(async (_req, res) => {
  const layout = await readFile(join(VIEWS, 'layout.html'), 'utf8');
  const body = `
    <section class="sec">
      <div class="wrap prose-narrow">
        <p class="eyebrow">404</p>
        <h1 class="h-lg">It went looking and came back with nothing.</h1>
        <p class="lede">That page isn't here. Try the <a href="/">home page</a>, or
        read <a href="/what-it-does">what it does</a>.</p>
      </div>
    </section>`;
  res
    .status(404)
    .type('html')
    .send(
      layout
        .replaceAll('{{TITLE}}', "Not found — lil' help")
        .replaceAll('{{DESCRIPTION}}', 'That page does not exist.')
        .replaceAll('{{NAV}}', '')
        .replace('{{CONTENT}}', body)
        .replaceAll('{{YEAR}}', String(new Date().getFullYear()))
    );
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).type('text').send('Something broke on our side.');
});

app.listen(PORT, () => {
  console.log(`lil' help site running at http://localhost:${PORT}`);
});
