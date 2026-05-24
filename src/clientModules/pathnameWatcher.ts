/**
 * Writes the current pathname onto <body data-pathname="...">.
 * Custom CSS in src/css/custom.css uses this to show navbar tabs that match
 * the active docs instance (TR vs EN vs API Reference) and hide the others.
 *
 * Registered via `clientModules` in docusaurus.config.ts.
 */
function updatePathname(pathname: string) {
  if (typeof document === 'undefined') return;
  document.body.dataset.pathname = pathname;
}

export function onRouteDidUpdate({location}: {location: {pathname: string}}) {
  updatePathname(location.pathname);
}

export function onRouteUpdate({location}: {location: {pathname: string}}) {
  updatePathname(location.pathname);
}

if (typeof window !== 'undefined') {
  updatePathname(window.location.pathname);
}
