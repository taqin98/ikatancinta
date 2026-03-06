const APP_BASE_URL = import.meta.env.BASE_URL || "/";
const normalizedBase = APP_BASE_URL.endsWith("/") ? APP_BASE_URL : `${APP_BASE_URL}/`;

export const PUBLIC_TEMPLATE_PREFIX = `${normalizedBase}templates/premium/botanical-elegance/`;
export const PUBLIC_ASSET_PREFIX = `${PUBLIC_TEMPLATE_PREFIX}assets/`;

export function resolveAssetUrl(path) {
    if (!path || typeof path !== "string") return path;
    if (/^(data:|blob:|#|mailto:|tel:)/i.test(path)) return path;

    const sanitized = path.trim().replace(/\\\//g, "/").replace(/^\.?\//, "");
    if (!sanitized) return path;

    if (sanitized.startsWith("assets/")) {
        return `${PUBLIC_TEMPLATE_PREFIX}${sanitized}`;
    }
    if (sanitized.startsWith("/assets/")) {
        return `${PUBLIC_TEMPLATE_PREFIX}${sanitized.slice(1)}`;
    }

    const uploadsMatch = sanitized.match(/(?:https?:\/\/[^/]+)?\/?wp-content\/uploads\/(.+)$/i);
    if (uploadsMatch) {
        return `${PUBLIC_ASSET_PREFIX}media/uploads/${uploadsMatch[1]}`;
    }

    const lottieMatch = sanitized.match(/(?:https?:\/\/[^/]+)?\/?wp-content\/uploads\/[^/]+\/[^/]+\/(bird-hitam(?:-2)?\.json)$/i);
    if (lottieMatch) {
        return `${PUBLIC_ASSET_PREFIX}media/lottie/${lottieMatch[1]}`;
    }

    const audioMatch = sanitized.match(/(?:https?:\/\/[^/]+)?\/?wp-content\/uploads\/[^/]+\/[^/]+\/(Howl-s-Moving-FULL-CUT\.mp3)$/i);
    if (audioMatch) {
        return `${PUBLIC_ASSET_PREFIX}media/audio/${audioMatch[1]}`;
    }

    if (/s\.w\.org\/images\/core\/emoji\/13\.0\.1\/svg\/2764\.svg/i.test(sanitized)) {
        return `${PUBLIC_ASSET_PREFIX}vendor/wordpress/emoji/13.0.1/svg/2764.svg`;
    }

    return path;
}

export function rewriteSrcset(srcset) {
    if (!srcset || typeof srcset !== "string") return srcset;
    return srcset
        .split(",")
        .map((part) => {
            const trimmed = part.trim();
            if (!trimmed) return trimmed;
            const [url, ...rest] = trimmed.split(/\s+/);
            const next = resolveAssetUrl(url);
            return rest.length > 0 ? `${next} ${rest.join(" ")}` : next;
        })
        .join(", ");
}

export function sanitizeTemplateHtml(rawHtml) {
    if (!rawHtml || typeof rawHtml !== "string") return "";

    if (typeof DOMParser === "undefined") {
        return rawHtml.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<meta[^>]*>/gi, "");
    }

    const doc = new DOMParser().parseFromString(rawHtml, "text/html");

    doc.querySelectorAll("script, meta").forEach((node) => node.remove());
    doc.querySelectorAll("*").forEach((node) => {
        Array.from(node.attributes).forEach((attr) => {
            if (/^on/i.test(attr.name)) {
                node.removeAttribute(attr.name);
            }
        });
    });

    return doc.body.innerHTML;
}

export function setDynamicVh() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
}

export function slideToggleElement(element, duration = 1000) {
    if (!element) return;

    const isOpen = element.classList.contains("be-open");
    if (isOpen) {
        element.style.maxHeight = `${element.scrollHeight}px`;
        element.style.opacity = "1";
        requestAnimationFrame(() => {
            element.classList.remove("be-open");
            element.style.maxHeight = "0px";
            element.style.opacity = "0";
        });
        window.setTimeout(() => {
            if (!element.classList.contains("be-open")) {
                element.style.display = "none";
            }
        }, duration + 20);
        return;
    }

    element.style.display = "block";
    element.style.maxHeight = "0px";
    element.style.opacity = "0";

    requestAnimationFrame(() => {
        element.classList.add("be-open");
        element.style.maxHeight = `${element.scrollHeight}px`;
        element.style.opacity = "1";
    });
}

export function formatCountdown(targetInput) {
    const target = new Date(targetInput).getTime();
    if (!Number.isFinite(target)) {
        return { days: "00", hours: "00", minutes: "00", seconds: "00", ended: true };
    }

    const diff = target - Date.now();
    if (diff <= 0) {
        return { days: "00", hours: "00", minutes: "00", seconds: "00", ended: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return {
        days: String(days).padStart(2, "0"),
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
        ended: false,
    };
}

export function updateCountdownNode(node, targetInput) {
    if (!node) return;
    const value = formatCountdown(targetInput);

    const days = node.querySelector("[data-days]");
    const hours = node.querySelector("[data-hours]");
    const minutes = node.querySelector("[data-minutes]");
    const seconds = node.querySelector("[data-seconds]");

    if (days) days.textContent = value.days;
    if (hours) hours.textContent = value.hours;
    if (minutes) minutes.textContent = value.minutes;
    if (seconds) seconds.textContent = value.seconds;
}

export function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
}

export function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export function formatWishTimestamp(value) {
    const text = normalizeText(value);
    if (!text) return "";
    if (!text.includes("T")) return text;

    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return text;

    return date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export async function copyToClipboard(text) {
    const value = String(text || "").trim();
    if (!value) return false;

    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(value);
            return true;
        }
    } catch {
        // fallback below
    }

    try {
        const temp = document.createElement("textarea");
        temp.value = value;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        temp.remove();
        return true;
    } catch {
        return false;
    }
}

export function toInstagramUrl(handleOrUrl) {
    const text = normalizeText(handleOrUrl);
    if (!text) return "https://instagram.com";
    if (/^https?:\/\//i.test(text)) return text;
    return `https://instagram.com/${text.replace(/^@/, "")}`;
}

export function loadScriptOnce(id, src) {
    if (!src) return Promise.resolve(null);
    const existing = document.getElementById(id);
    if (existing) {
        if (existing.dataset.loaded === "true") return Promise.resolve(existing);
        return new Promise((resolve, reject) => {
            existing.addEventListener("load", () => resolve(existing), { once: true });
            existing.addEventListener("error", reject, { once: true });
        });
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.id = id;
        script.src = src;
        script.async = true;
        script.onload = () => {
            script.dataset.loaded = "true";
            resolve(script);
        };
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

export function parseDataSettings(value) {
    if (!value || typeof value !== "string") return null;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

export function formatParentInfoHtml(value) {
    const text = normalizeText(value);
    if (!text) return "<p>-</p>";
    const parts = text.split(/\s*&\s*/).map((item) => item.trim()).filter(Boolean);
    return parts.map((item) => `<p>${escapeHtml(item)}</p>`).join("");
}

export function formatAddressHtml(addressName, address) {
    const line1 = normalizeText(addressName);
    const line2 = normalizeText(address);
    return [line1, line2].filter(Boolean).map((item) => `<p>${escapeHtml(item)}</p>`).join("");
}
