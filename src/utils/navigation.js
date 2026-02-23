export function getCurrentPathname() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

export function navigateTo(href) {
  const url = new URL(href, window.location.origin);
  const isSameOrigin = url.origin === window.location.origin;

  if (!isSameOrigin) {
    window.location.href = href;
    return;
  }

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (nextUrl !== currentUrl) {
    window.history.pushState({}, "", nextUrl);
    window.dispatchEvent(new Event("app:navigate"));
  }

  if (!url.hash) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  setTimeout(() => {
    const target = document.querySelector(url.hash);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 0);
}

export function openInNewTab(href) {
  const url = new URL(href, window.location.origin);
  window.open(url.toString(), "_blank", "noopener,noreferrer");
}
