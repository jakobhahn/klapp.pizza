import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

await import('../seasonal-content.js');

const seasonal = globalThis.JoschiSeasonal;

test('uses Europe/Berlin for the September start boundary', () => {
  assert.equal(seasonal.timeZone, 'Europe/Berlin');
  assert.equal(seasonal.isChristmasSeason(new Date('2026-08-31T21:59:59.999Z')), false);
  assert.equal(seasonal.isChristmasSeason(new Date('2026-08-31T22:00:00.000Z')), true);
});

test('keeps December 15 visible and hides content from December 16', () => {
  assert.equal(seasonal.isChristmasSeason(new Date('2026-12-15T22:59:59.999Z')), true);
  assert.equal(seasonal.isChristmasSeason(new Date('2026-12-15T23:00:00.000Z')), false);
});

test('recurs every year and stays inactive around New Year', () => {
  assert.equal(seasonal.isChristmasSeason(new Date('2026-12-31T12:00:00.000Z')), false);
  assert.equal(seasonal.isChristmasSeason(new Date('2027-01-01T12:00:00.000Z')), false);
  assert.equal(seasonal.isChristmasSeason(new Date('2027-09-01T10:00:00.000Z')), true);
});

test('writes the active state to the document element', () => {
  const attributes = new Map();
  const documentRef = {
    documentElement: {
      setAttribute(name, value) { attributes.set(name, value); }
    }
  };

  assert.equal(seasonal.applyChristmasSeason(documentRef, new Date('2026-02-01T12:00:00.000Z')), false);
  assert.equal(attributes.get('data-christmas-season'), 'inactive');
  assert.equal(seasonal.applyChristmasSeason(documentRef, new Date('2026-10-01T12:00:00.000Z')), true);
  assert.equal(attributes.get('data-christmas-season'), 'active');
});

test('redirects the Christmas landing page only outside the season', () => {
  const attributes = new Map([['data-seasonal-page', 'christmas']]);
  const documentRef = {
    documentElement: {
      hidden: true,
      setAttribute(name, value) { attributes.set(name, value); },
      getAttribute(name) { return attributes.get(name) || null; }
    }
  };
  const redirects = [];
  const locationRef = {
    href: 'https://klapp.pizza/weihnachtsfeier-hamburg.html',
    replace(url) { redirects.push(url); }
  };

  assert.equal(seasonal.applyChristmasSeason(documentRef, new Date('2026-07-01T12:00:00.000Z'), locationRef), false);
  assert.equal(documentRef.documentElement.hidden, true);
  assert.deepEqual(redirects, ['https://klapp.pizza/eventlocation-st-pauli.html']);

  redirects.length = 0;
  assert.equal(seasonal.applyChristmasSeason(documentRef, new Date('2026-10-01T12:00:00.000Z'), locationRef), true);
  assert.equal(documentRef.documentElement.hidden, false);
  assert.deepEqual(redirects, []);
});

test('all public Christmas links are seasonally marked and the landing page is gated', () => {
  const referringPages = ['index.html', 'pizza-catering-hamburg.html', 'eventlocation-st-pauli.html'];

  for (const page of referringPages) {
    const html = readFileSync(page, 'utf8');
    assert.match(html, /<link rel="stylesheet" href="seasonal-content\.css">/, `${page} must load fail-closed seasonal styles`);
    assert.match(html, /<script src="seasonal-content\.js"><\/script>/, `${page} must load the seasonal controller`);

    const links = html.match(/<a\b[^>]*href="weihnachtsfeier-hamburg\.html"[^>]*>/g) || [];
    assert.ok(links.length > 0, `${page} must contain a Christmas landing-page link`);
    for (const link of links) {
      assert.match(link, /data-seasonal="christmas"/, `${page} has an unmarked Christmas link`);
    }
  }

  const landingPage = readFileSync('weihnachtsfeier-hamburg.html', 'utf8');
  assert.match(landingPage, /<html lang="de" data-seasonal-page="christmas" hidden>/);
  assert.match(landingPage, /<link rel="stylesheet" href="seasonal-content\.css">/);
  assert.match(landingPage, /<script src="seasonal-content\.js"><\/script>/);

  assert.match(readFileSync('index.html', 'utf8'), /data-seasonal="christmas"> oder Weihnachtsfeier<\/span>/);
  assert.match(readFileSync('pizza-catering-hamburg.html', 'utf8'), /<span data-seasonal="christmas"> Für eine/);
  assert.match(readFileSync('eventlocation-st-pauli.html', 'utf8'), /<span data-seasonal="christmas"> &amp; Weihnachtsfeier<\/span>/);
});
