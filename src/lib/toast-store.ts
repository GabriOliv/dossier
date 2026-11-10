// The toast queue behind `toast()` and `<Toaster />`: plain module state, no React, so it can be called from any
// handler and read with useSyncExternalStore.

export interface ToastOptions {
  /** The message. An empty title creates no toast. */
  title: string;
  /** A second line under the title. */
  description?: string;
  /** `error` goes to the `role="alert"` container, in the error colour, and never closes by itself. */
  tone?: "default" | "error";
  /** How long the toast stays once shown, in ms: 6000 by default. `Infinity` keeps it until it is closed. */
  duration?: number;
}

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: "default" | "error";
}

export interface ToastState {
  /** The Toaster that shows the toasts: the first one mounted, or null when none is. */
  owner: object | null;
  /** The toasts on screen, at most 3, in order of arrival. */
  toasts: readonly ToastItem[];
}

interface Entry {
  toast: ToastItem;
  /** Time left before it closes, in ms. */
  remaining: number;
  paused: boolean;
  timer?: ReturnType<typeof setTimeout>;
  /** When the running timer started, by Date.now(). */
  since: number;
}

/** How many toasts show at a time; the others wait in order of arrival. */
const VISIBLE = 3;
const DURATION = 6000;
/** The longest delay setTimeout takes: above it, the timer overflows and fires at once. */
const MAX_DELAY = 2147483647;
const EMPTY: ToastState = { owner: null, toasts: [] };

let entries: Entry[] = [];
let owners: object[] = [];
/** Toasters that unregistered in this task: they count as gone only once the task ends. */
const leaving = new Set<object>();
let state = EMPTY;
let count = 0;
const listeners = new Set<() => void>();

/** Runs the timer of each shown toast that is not paused and has a finite time, and stops every other one. */
function sync(): void {
  entries.forEach((e, i) => {
    const run = owners.length > 0 && !leaving.has(owners[0]) && i < VISIBLE && !e.paused && e.remaining !== Infinity;
    if (run && e.timer === undefined) {
      e.since = Date.now();
      e.timer = setTimeout(() => dismiss(e.toast.id), e.remaining);
    } else if (!run && e.timer !== undefined) {
      clearTimeout(e.timer);
      e.timer = undefined;
      e.remaining -= Date.now() - e.since;
    }
  });
}

function publish(): void {
  sync();
  state = { owner: owners[0] ?? null, toasts: entries.slice(0, VISIBLE).map((e) => e.toast) };
  listeners.forEach((l) => l());
}

/** Queues a toast and returns its id, or null when the title is empty. */
export function add({ title, description, tone = "default", duration = DURATION }: ToastOptions): string | null {
  if (!title) return null;
  const id = `ds-toast-${++count}`;
  entries.push({
    toast: { id, title, description, tone },
    remaining: tone === "error" || duration > MAX_DELAY ? Infinity : duration,
    paused: false,
    since: 0,
  });
  publish();
  return id;
}

/** Closes the toast `id`, shown or waiting. An unknown id changes nothing. */
export function dismiss(id: string): void {
  const i = entries.findIndex((e) => e.toast.id === id);
  if (i < 0) return;
  clearTimeout(entries[i].timer);
  entries.splice(i, 1);
  publish();
}

const setPaused = (id: string, paused: boolean): void => {
  const e = entries.find((x) => x.toast.id === id);
  if (!e) return;
  e.paused = paused;
  sync();
};

/** Stops the time of toast `id`, keeping what is left. */
export const pause = (id: string): void => setPaused(id, true);
/** Runs the time of toast `id` again from what was left. */
export const resume = (id: string): void => setPaused(id, false);

/**
 * Registers a Toaster. The first one registered shows the toasts; their time runs only while one is. The returned
 * function unregisters it; when it is the one showing the toasts they are dropped, not handed to the next Toaster,
 * unless it registers again in the same task (React's StrictMode runs an effect's cleanup and the effect again).
 */
export function claim(owner: object): () => void {
  if (!leaving.delete(owner)) owners.push(owner);
  publish();
  return () => {
    leaving.add(owner);
    sync();
    queueMicrotask(() => {
      if (!leaving.delete(owner)) return;
      if (owners[0] === owner) entries = [];
      owners = owners.filter((o) => o !== owner);
      publish();
    });
  };
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const snapshot = (): ToastState => state;
/** What the server renders: no Toaster owns, no toast shows. */
export const serverSnapshot = (): ToastState => EMPTY;
