/**
 * Register lightweight Service Worker for REHABTRACK PWA
 */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('REHABTRACK Service Worker registered successfully:', registration.scope)

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (
                installingWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                console.log('REHABTRACK new content is available; please refresh.')
              }
            })
          }
        })
      })
      .catch((err) => {
        console.warn('REHABTRACK Service Worker registration failed:', err)
      })
  })
}
