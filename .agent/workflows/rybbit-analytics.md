---
description: How to correctly integrate Rybbit analytics into a Next.js project
---

# Rybbit Analytics Integration for Next.js

## ⚠️ CRITICAL: DO NOT use Next.js rewrites to proxy Rybbit

**NEVER** proxy the Rybbit tracking script through Next.js rewrites like this:

```js
// ❌ WRONG — DO NOT DO THIS
async rewrites() {
  return [
    { source: '/rb/script.js', destination: 'https://tracking.whoisjason.me/api/script.js' },
    { source: '/rb/track', destination: 'https://tracking.whoisjason.me/api/track' },
  ];
}
```

**Why:** Next.js rewrites proxy requests at the server level. The tracking POST from the browser goes to the Next.js server, which creates a **new** HTTP request to the Rybbit server. The original client IP is completely lost. Rybbit sees the Next.js server's IP for ALL visitors, making analytics useless (everyone looks like the same visitor, and IP exclusions silently hide real users).

## ✅ Correct approach: Load Rybbit directly

Always load the Rybbit script directly from the tracking server, exactly as whoisjason.me does:

```jsx
// app/layout.js or a dedicated RybbitAnalytics client component
import Script from 'next/script';

<Script
  src="https://tracking.whoisjason.me/api/script.js"
  data-site-id="YOUR_SITE_ID"
  strategy="afterInteractive"
/>
```

- Place it inside `<body>`, after `{children}` or after providers
- Use `strategy="afterInteractive"` (required for SPA tracking)
- Use the Next.js `Script` component, NOT a raw `<script>` tag
- The browser talks directly to `tracking.whoisjason.me` → real client IPs are preserved

## Reference: Jason's self-hosted Rybbit instance

- Tracking server: `https://tracking.whoisjason.me`
- Script URL: `https://tracking.whoisjason.me/api/script.js`
- Tracking endpoint: `https://tracking.whoisjason.me/api/track`

## Sites that need this pattern

All of Jason's websites that use Rybbit should load the script directly from `tracking.whoisjason.me`, never through Next.js rewrites.
