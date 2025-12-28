# Vite PWA Plugin API Reference - Documentation URLs

Quick reference for looking up official Vite PWA Plugin documentation.

---

## Base URL

- **Vite PWA Docs**: `https://vite-pwa-org.netlify.app`

---

## Getting Started

### Introduction & Overview

- **Guide Introduction**: https://vite-pwa-org.netlify.app/guide/
- **PWA Minimal Requirements**: https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.html
- **FAQ**: https://vite-pwa-org.netlify.app/guide/faq.html
- **Change Log**: https://vite-pwa-org.netlify.app/guide/change-log.html

### Development

- **Development Workflow**: https://vite-pwa-org.netlify.app/guide/development.html
- **Testing Service Worker**: https://vite-pwa-org.netlify.app/guide/testing-service-worker.html
- **Scaffolding**: https://vite-pwa-org.netlify.app/guide/scaffolding.html

---

## Service Worker Strategies

### Core Concepts

- **Service Worker Strategies and Behaviors**: https://vite-pwa-org.netlify.app/guide/service-worker-strategies-and-behaviors.html
- **Service Worker Precache**: https://vite-pwa-org.netlify.app/guide/service-worker-precache.html
- **Service Worker Without PWA Capabilities**: https://vite-pwa-org.netlify.app/guide/service-worker-without-pwa-capabilities.html

### Workbox Integration

- **Workbox Overview**: https://vite-pwa-org.netlify.app/workbox/
- **generateSW Mode**: https://vite-pwa-org.netlify.app/workbox/generate-sw.html
- **injectManifest Mode**: https://vite-pwa-org.netlify.app/workbox/inject-manifest.html

---

## Registration & Updates

### Registration

- **Register Service Worker**: https://vite-pwa-org.netlify.app/guide/register-service-worker.html
- **Unregister Service Worker**: https://vite-pwa-org.netlify.app/guide/unregister-service-worker.html

### Update Strategies

- **Auto Update**: https://vite-pwa-org.netlify.app/guide/auto-update.html
- **Prompt for Update**: https://vite-pwa-org.netlify.app/guide/prompt-for-update.html
- **Periodic SW Updates**: https://vite-pwa-org.netlify.app/guide/periodic-sw-updates.html

### Advanced

- **Inject Manifest**: https://vite-pwa-org.netlify.app/guide/inject-manifest.html

---

## Asset Management

### Static Assets

- **Static Assets Handling**: https://vite-pwa-org.netlify.app/guide/static-assets.html

### PWA Assets Generator

- **Assets Generator Overview**: https://vite-pwa-org.netlify.app/assets-generator/
- **CLI Usage**: https://vite-pwa-org.netlify.app/assets-generator/cli.html
- **API Usage**: https://vite-pwa-org.netlify.app/assets-generator/api.html

---

## Framework-Specific

### Svelte Integration

- **Svelte Configuration**: https://vite-pwa-org.netlify.app/frameworks/svelte.html

---

## Deployment

### General

- **Deployment Overview**: https://vite-pwa-org.netlify.app/deployment/

### Platform-Specific

- **Vercel**: https://vite-pwa-org.netlify.app/deployment/vercel.html

---

## Additional Resources

### Cookbook & Examples

- **Cookbook**: https://vite-pwa-org.netlify.app/guide/cookbook.html

---

## Common Patterns

### Basic Configuration (generateSW)

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'My App',
        short_name: 'App',
        description: 'My awesome Progressive Web App',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
```

### Svelte Auto-Update with Virtual Module

```typescript
// src/main.ts
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Show update prompt
  },
  onOfflineReady() {
    // Show offline ready message
  }
})
```

### Svelte Reactive Stores (Prompt for Update)

```typescript
// src/lib/pwa.ts
import { useRegisterSW } from 'virtual:pwa-register/svelte'

const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW()

// In your component:
if ($needRefresh) {
  // Show update UI
  await updateServiceWorker(true) // Reload page after update
}
```

### Custom Service Worker (injectManifest)

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
})
```

```typescript
// src/sw.ts
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare let self: ServiceWorkerGlobalScope

self.skipWaiting()
clientsClaim()

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)
```

### Including Additional Static Assets

```typescript
// vite.config.ts
VitePWA({
  includeAssets: ['fonts/*.ttf', 'images/*.png'],
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,ttf,woff,woff2}']
  }
})
```

### Periodic Updates

```typescript
// src/main.ts
import { registerSW } from 'virtual:pwa-register'

const intervalMS = 60 * 60 * 1000 // 1 hour

const updateSW = registerSW({
  onRegistered(r) {
    r && setInterval(() => {
      r.update()
    }, intervalMS)
  }
})
```

### Development Mode

```typescript
// vite.config.ts
VitePWA({
  devOptions: {
    enabled: true,
    type: 'module',
    navigateFallback: 'index.html'
  }
})
```

---

## Best Practices

### Manifest Requirements

1. **Required Fields** - Include `name`, `short_name`, `description`, `theme_color`, and `icons`
2. **Icon Sizes** - Minimum 192x192 and 512x512 PNG icons required
3. **Apple Touch Icon** - Include 180x180 icon for iOS/macOS
4. **Theme Color** - Must match HTML meta theme-color tag

### Caching Strategy

1. **Never Cache Critical Files** - Don't cache `/`, `/sw.js`, `/index.html`, or `/manifest.webmanifest` with long TTLs
2. **Use Hash-Based Caching** - Let Vite handle cache busting for JS/CSS with hashed filenames
3. **Precache Selectively** - Only include essential assets in precache manifest
4. **Configure globPatterns** - Explicitly define which file types to precache

### Service Worker Registration

1. **Choose Registration Type** - Use `autoUpdate` for seamless updates, `prompt` for user control
2. **Handle Update Callbacks** - Implement `onNeedRefresh` and `onOfflineReady` for better UX
3. **Periodic Updates** - Implement periodic SW checks for long-running applications
4. **Development Mode** - Enable `devOptions.enabled` for testing SW during development

### Update Strategies

1. **Auto-Update Trade-offs** - Avoid auto-update if users work with forms or unsaved data
2. **Prompt Users** - Use `registerType: 'prompt'` for applications with critical user data
3. **Cache Cleanup** - Let Workbox handle automatic cleanup of outdated caches
4. **Skip Waiting** - Use `self.skipWaiting()` in custom SW for immediate activation

### Deployment Considerations

1. **HTTPS Required** - Always serve PWAs over HTTPS with HTTP redirect
2. **Correct MIME Types** - Serve manifest with `application/manifest+json` content type
3. **Cache-Control Headers** - Use restrictive caching for non-hashed files
4. **Test Deployment** - Use WebPageTest to validate PWA functionality and performance

### Asset Generation

1. **Use SVG Sources** - Generate icons from SVG for best quality across all sizes
2. **Minimal Icon Set** - Include at least 192x192, 512x512, and 180x180 (Apple)
3. **Maskable Icons** - Provide maskable icon for better adaptive icon support
4. **Automate Generation** - Use `@vite-pwa/assets-generator` for consistent icon generation

---

**Key Resources:**

- **Main Documentation**: https://vite-pwa-org.netlify.app/guide/
- **Workbox Documentation**: https://developer.chrome.com/docs/workbox/
- **PWA Builder**: https://www.pwabuilder.com/
- **Web App Manifest**: https://developer.mozilla.org/en-US/docs/Web/Manifest
