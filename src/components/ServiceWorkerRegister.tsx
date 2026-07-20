"use client";

import { useEffect } from "react";

// Service worker registration is disabled entirely (not just gated to
// production) as of this fix. It was causing exactly the class of bug
// that's well-documented for service workers interacting with a dev
// server: intercepted requests hanging or serving stale/mishandled
// responses, reported here as "the homepage keeps loading."
//
// A production-only gate would reduce the risk but I have no way to
// verify that actually resolves it — no network access to run `next dev`
// myself. Given that, and given a broken PWA "nice to have" is a much
// worse trade than no offline support at all, this component now only
// cleans up: it actively unregisters any service worker this app
// previously installed in your browser (from before this fix shipped)
// and clears the cache it created, in every environment, rather than
// registering a new one anywhere.
//
// public/sw.js and public/manifest.json are left in place, unused, if
// someone wants to properly re-enable and test PWA support later with a
// real dev server available — see README.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
    if ("caches" in window) {
      caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
    }
  }, []);
  return null;
}
