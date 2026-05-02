import type { Heading } from "../types";

const SELECTOR = "h1, h2, h3, h4";
const SKIP_ANCESTORS = ["nav", "aside", "header", "footer"];

let counter = 0;

function isVisible(el: HTMLElement): boolean {
  if (!el.isConnected) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;
  const style = getComputedStyle(el);
  if (style.visibility === "hidden" || style.display === "none") return false;
  return true;
}

function pickRoot(): ParentNode {
  // Prefer canonical content containers when available; otherwise document.
  const candidates = [
    "main",
    "article",
    "[role=main]",
    "[role=article]",
    "#main",
    "#content",
    ".content",
    ".markdown-body",
  ];
  for (const sel of candidates) {
    const el = document.querySelector(sel);
    if (el && el.querySelector(SELECTOR)) return el;
  }
  return document;
}

function ensureId(el: HTMLElement): string {
  if (el.id) return el.id;
  const slug =
    (el.textContent ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || `heading-${++counter}`;
  let candidate = slug;
  let i = 1;
  while (document.getElementById(candidate)) candidate = `${slug}-${++i}`;
  el.id = candidate;
  return candidate;
}

export function extractHeadings(): Heading[] {
  const root = pickRoot();
  const nodes = root.querySelectorAll<HTMLElement>(SELECTOR);
  const result: Heading[] = [];
  for (const el of nodes) {
    if (!isVisible(el)) continue;
    if (el.closest(SKIP_ANCESTORS.join(","))) continue;
    const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
    if (!text) continue;
    result.push({
      id: ensureId(el),
      level: Number(el.tagName[1]),
      text,
      el,
    });
  }
  return result;
}

export function findCurrentHeading(headings: Heading[]): Heading | null {
  // The "current" heading is the last one whose top is above the viewport's
  // upper third — that matches what a reader is actually looking at.
  const threshold = window.innerHeight * 0.3;
  let current: Heading | null = null;
  for (const h of headings) {
    const top = h.el.getBoundingClientRect().top;
    if (top - threshold <= 0) current = h;
    else break;
  }
  return current ?? headings[0] ?? null;
}
