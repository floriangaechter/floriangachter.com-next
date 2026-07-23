import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const site = path.join(root, "_site");
const src = path.join(root, "src");

// Post slugs are whatever bundles exist under src/posts, so this suite keeps
// working as posts are added or removed, no editing required.
const postSlugs = fs
  .readdirSync(path.join(src, "posts"), { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

function html(url) {
  const file = path.join(site, url, "index.html");
  assert.ok(fs.existsSync(file), `missing built page: ${url}`);
  return fs.readFileSync(file, "utf8");
}

function allHtmlFiles(dir = site) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return allHtmlFiles(full);
    return e.name.endsWith(".html") ? [full] : [];
  });
}

test("_site exists (did `npm run build` run?)", () => {
  assert.ok(fs.existsSync(site), "no _site/ found, run `npm run build` first");
});

test("every expected page is built", () => {
  for (const url of ["/", "/about/", "/uses/"]) html(url);
  for (const slug of postSlugs) html(`/posts/${slug}/`);
});

test("every page has a non-empty <title>", () => {
  for (const file of allHtmlFiles()) {
    const title = fs.readFileSync(file, "utf8").match(/<title>([\s\S]*?)<\/title>/);
    assert.ok(title && title[1].trim(), `empty <title> in ${path.relative(site, file)}`);
  }
});

test("the home page links every post", () => {
  const home = html("/");
  for (const slug of postSlugs) {
    assert.match(home, new RegExp(`href="/posts/${slug}/"`), `home missing link to ${slug}`);
  }
});

test("every referenced /img asset resolves on disk", () => {
  const re = /\/img\/[A-Za-z0-9_-]+\.(?:avif|webp|jpe?g|png|svg)/g;
  for (const file of allHtmlFiles()) {
    const body = fs.readFileSync(file, "utf8");
    for (const ref of new Set(body.match(re) ?? [])) {
      assert.ok(fs.existsSync(path.join(site, ref)), `broken image ${ref} in ${path.relative(site, file)}`);
    }
  }
});

test("RSS feed has one item per post", () => {
  const rss = fs.readFileSync(path.join(site, "rss.xml"), "utf8");
  const items = (rss.match(/<item>/g) ?? []).length;
  assert.equal(items, postSlugs.length, `RSS has ${items} items, expected ${postSlugs.length}`);
});
