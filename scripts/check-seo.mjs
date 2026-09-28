import { readFileSync, existsSync } from 'node:fs';

const pages = [
  'index.html',
  'pizza-catering-hamburg.html',
  'eventlocation-st-pauli.html',
  'weihnachtsfeier-hamburg.html',
  'impressum.html',
  'datenschutz.html'
];

const llmMirrors = new Map([
  ['index.html', 'index.md'],
  ['pizza-catering-hamburg.html', 'pizza-catering-hamburg.md'],
  ['eventlocation-st-pauli.html', 'eventlocation-st-pauli.md'],
  ['weihnachtsfeier-hamburg.html', 'weihnachtsfeier-hamburg.md']
]);

const errors = [];

function count(html, pattern) {
  return (html.match(pattern) || []).length;
}

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const required = [
    ['title', /<title>[^<]+<\/title>/gi],
    ['meta description', /<meta\s+name="description"\s+content="[^"]+"\s*\/?>/gi],
    ['canonical', /<link\s+rel="canonical"\s+href="https:\/\/klapp\.pizza\/[^"]*"\s*\/?>/gi],
    ['H1', /<h1(?:\s[^>]*)?>[\s\S]*?<\/h1>/gi]
  ];

  for (const [label, pattern] of required) {
    const matches = count(html, pattern);
    if (matches !== 1) errors.push(`${page}: expected 1 ${label}, found ${matches}`);
  }

  for (const match of html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      errors.push(`${page}: invalid JSON-LD (${error.message})`);
    }
  }

  for (const match of html.matchAll(/href="([^"#?]+\.html)(?:#[^"]*)?"/gi)) {
    if (/^https?:\/\//i.test(match[1])) continue;
    if (!existsSync(match[1])) errors.push(`${page}: missing internal link target ${match[1]}`);
  }

  const mirror = llmMirrors.get(page);
  if (mirror) {
    const mirrorUrl = `https://klapp.pizza/${mirror}`;
    if (!html.includes(`rel="alternate" type="text/markdown" title="Markdown-Version" href="${mirrorUrl}"`)) {
      errors.push(`${page}: missing Markdown alternate ${mirrorUrl}`);
    }
    if (!html.includes('rel="describedby" type="text/markdown" href="https://klapp.pizza/llms.txt"')) {
      errors.push(`${page}: missing llms.txt describedby link`);
    }
    if (!existsSync(mirror)) errors.push(`${page}: missing Markdown mirror ${mirror}`);
  }
}

const sitemap = readFileSync('sitemap.xml', 'utf8');
for (const page of pages) {
  const url = page === 'index.html' ? 'https://klapp.pizza/' : `https://klapp.pizza/${page}`;
  if (!sitemap.includes(`<loc>${url}</loc>`)) errors.push(`sitemap.xml: missing ${url}`);
}

const llms = readFileSync('llms.txt', 'utf8');
const llmsContentLines = llms.split(/\r?\n/).filter((line) => line.trim());
if (!llmsContentLines[0]?.startsWith('# ')) errors.push('llms.txt: first content line must be an H1');
if (!llmsContentLines[1]?.startsWith('> ')) errors.push('llms.txt: second content line must be a blockquote summary');

for (const mirror of llmMirrors.values()) {
  const url = `https://klapp.pizza/${mirror}`;
  if (!llms.includes(`](${url})`)) errors.push(`llms.txt: missing Markdown mirror link ${url}`);
  if (existsSync(mirror)) {
    const markdown = readFileSync(mirror, 'utf8');
    if (!markdown.startsWith('# ')) errors.push(`${mirror}: first line must be an H1`);
    if (!markdown.includes('Kanonische Webseite: https://klapp.pizza/')) errors.push(`${mirror}: missing canonical webpage reference`);
  }
}

const robots = readFileSync('robots.txt', 'utf8');
for (const crawler of ['OAI-SearchBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot']) {
  if (!robots.includes(`User-agent: ${crawler}`)) errors.push(`robots.txt: missing ${crawler}`);
}
if (!robots.includes('Sitemap: https://klapp.pizza/sitemap.xml')) errors.push('robots.txt: missing sitemap URL');

for (const file of ['.well-known/ai-plugin.json', '.well-known/openapi-reservations.json']) {
  try {
    JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    errors.push(`${file}: invalid JSON (${error.message})`);
  }
}

const deployment = readFileSync('.github/workflows/deploy.yml', 'utf8');
if (!deployment.includes('./.well-known')) errors.push('deploy workflow: .well-known is not included');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`SEO checks passed for ${pages.length} public pages.`);
