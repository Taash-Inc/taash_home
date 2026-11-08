'use client';

import { useSyncExternalStore } from 'react';

/**
 * Whether this visitor has joined the waitlist, shared by every signup form on the page so that
 * joining in the hero also turns the form further down (and any later visit) into the success
 * state. Only a flag and the first name are kept in localStorage, never the email address.
 *
 * Storage can be missing or throw (private windows, in-app browsers with storage blocked), so
 * every access is guarded and the in-memory value still works for the current page view.
 */
export type JoinedState = { firstName: string } | null;

const KEY = 'taash:waitlist-joined';
const listeners = new Set<() => void>();
let current: JoinedState | undefined;

function read(): JoinedState {
  if (current !== undefined) return current;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    current =
      parsed && typeof parsed === 'object' && typeof (parsed as JoinedState)?.firstName === 'string'
        ? { firstName: (parsed as { firstName: string }).firstName }
        : null;
  } catch {
    current = null;
  }
  return current;
}

function write(next: JoinedState) {
  current = next;
  try {
    if (next) window.localStorage.setItem(KEY, JSON.stringify(next));
    else window.localStorage.removeItem(KEY);
  } catch {
    // The flag is a convenience; the signup itself already succeeded on the server.
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

export function useWaitlistJoined(): JoinedState {
  return useSyncExternalStore(subscribe, read, () => null);
}

export const markJoined = (firstName: string) => write({ firstName });
export const clearJoined = () => write(null);
