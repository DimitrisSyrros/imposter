import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Ο Imposter",
        short_name: "Imposter",
        description: "Παιχνίδι λέξεων για την παρέα, με ένα κινητό που περνάει από χέρι σε χέρι.",
        lang: "el",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0b1114",
        theme_color: "#0b1114",
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
        // The TV pictures (about 560 KB) are not precached on every phone: the TV caches them
        // the first time it shows them, and then works offline like the rest of the app.
        globIgnores: ["**/tv-home-*.webp", "**/facade-night-tv-*.webp", "**/tv-pointing-*.webp"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\/assets\/(tv-home-\d|facade-night-tv|tv-pointing)-[^/]+\.webp$/.test(url.pathname),
            handler: "CacheFirst",
            options: { cacheName: "tv-pictures", expiration: { maxEntries: 10 } },
          },
        ],
      },
    }),
  ],
});
