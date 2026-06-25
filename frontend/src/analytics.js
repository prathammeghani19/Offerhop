import posthog from 'posthog-js'

export function initAnalytics() {
  posthog.init('phc_Br8nT2gsVfWdJxFiESNU9UhA3zxvxLFcGviufM7Q9ebv', {
    api_host: 'https://us.i.posthog.com',
    capture_pageview: false,      // we fire manually on route change
    capture_pageleave: true,
    autocapture: true,            // clicks, inputs, forms auto-tracked
    persistence: 'localStorage',
  })
}

export function trackPage(path) {
  posthog.capture('$pageview', { $current_url: window.location.href, path })
}

export function track(event, props = {}) {
  posthog.capture(event, props)
}
