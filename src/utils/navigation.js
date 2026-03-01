const rawBaseUrl = import.meta.env.BASE_URL || "/";
const normalizedBasePath = (() => {
  const trimmed = rawBaseUrl.replace(/\/+$/, "");
  if (!trimmed || trimmed === ".") return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
})();

function isExternalHref(href) {
  return /^(https?:|mailto:|tel:|\/\/)/i.test(href);
}

function withLeadingSlash(value) {
  if (!value) return "/";
  return value.startsWith("/") ? value : `/${value}`;
}

function collapseRepeatedSlashes(value) {
  return value.replace(/\/{2,}/g, "/");
}

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "") || "/";
}

function stripBasePath(pathname) {
  const clean = stripTrailingSlash(collapseRepeatedSlashes(pathname));
  if (!normalizedBasePath) return clean;
  if (clean === normalizedBasePath) return "/";
  if (clean.startsWith(`${normalizedBasePath}/`)) {
    return clean.slice(normalizedBasePath.length) || "/";
  }
  return clean;
}

export function toAppPath(href) {
  if (!href) return normalizedBasePath || "/";
  if (isExternalHref(href)) return href;

  const target = String(href).trim();
  const url = new URL(target, window.location.origin);
  if (url.origin !== window.location.origin) return target;

  let path = collapseRepeatedSlashes(withLeadingSlash(url.pathname || "/"));
  if (normalizedBasePath && path !== normalizedBasePath && !path.startsWith(`${normalizedBasePath}/`)) {
    path = path === "/" ? normalizedBasePath : `${normalizedBasePath}${path}`;
  }
  path = collapseRepeatedSlashes(path);

  return `${path}${url.search}${url.hash}`;
}

export function getCurrentPathname() {
  return stripBasePath(window.location.pathname);
}

export function navigateTo(href) {
  const resolvedHref = toAppPath(href);
  if (isExternalHref(resolvedHref)) {
    window.location.href = resolvedHref;
    return;
  }

  const url = new URL(resolvedHref, window.location.origin);
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
  const resolvedHref = toAppPath(href);
  const url = new URL(resolvedHref, window.location.origin);
  window.open(url.toString(), "_blank", "noopener,noreferrer");
}
