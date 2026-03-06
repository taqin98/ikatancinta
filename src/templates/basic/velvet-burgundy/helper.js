const APP_BASE_URL = import.meta.env.BASE_URL || "/";
const normalizedBase = APP_BASE_URL.endsWith("/") ? APP_BASE_URL : `${APP_BASE_URL}/`;
export const PUBLIC_ASSET_PREFIX = `${normalizedBase}templates/basic/velvet-burgundy/assets/`;

export function resolveAssetUrl(path) {
    if (!path || typeof path !== "string") return path;
    if (/^(https?:|data:|blob:|#)/i.test(path)) return path;

    const sanitized = path.trim().replace(/\\\//g, "/").replace(/^\.?\//, "");
    if (sanitized.startsWith("assets/")) {
        return `${PUBLIC_ASSET_PREFIX}${sanitized.slice("assets/".length)}`;
    }
    if (sanitized.startsWith("/assets/")) {
        return `${PUBLIC_ASSET_PREFIX}${sanitized.slice("/assets/".length)}`;
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

export function slideToggleElement(element, duration = 1000) {
    if (!element) return;

    const isOpen = element.classList.contains("vb-open");
    if (isOpen) {
        const currentHeight = element.scrollHeight;
        element.style.maxHeight = `${currentHeight}px`;
        requestAnimationFrame(() => {
            element.classList.remove("vb-open");
            element.style.maxHeight = "0px";
            element.style.opacity = "0";
        });
        window.setTimeout(() => {
            if (!element.classList.contains("vb-open")) {
                element.style.display = "none";
            }
        }, duration + 20);
        return;
    }

    element.style.display = "block";
    const targetHeight = element.scrollHeight;
    element.style.maxHeight = "0px";
    element.style.opacity = "0";

    requestAnimationFrame(() => {
        element.classList.add("vb-open");
        element.style.maxHeight = `${targetHeight}px`;
        element.style.opacity = "1";
    });

    window.setTimeout(() => {
        if (element.classList.contains("vb-open")) {
            element.style.maxHeight = `${element.scrollHeight}px`;
        }
    }, duration + 20);
}

export function setDynamicVh() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
}

export function runReveal(root) {
    if (!root) return;
    const classes = ["ef", "reveal", "revealin", "revealkanan", "revealkiri", "revealatas", "revealr"];
    const windowHeight = window.innerHeight;

    classes.forEach((className) => {
        root.querySelectorAll(`.${className}`).forEach((node) => {
            const elementTop = node.getBoundingClientRect().top;
            const visible = className === "ef" ? 100 : 150;
            if (elementTop < windowHeight - visible) {
                node.classList.add("active");
            } else {
                node.classList.remove("active");
            }
        });
    });
}

export async function copyToClipboard(text) {
    const value = String(text || "").trim();
    if (!value) return false;

    try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
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

export function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
}

export function toInstagramUrl(handleOrUrl) {
    const text = normalizeText(handleOrUrl);
    if (!text) return "https://instagram.com";
    if (/^https?:\/\//i.test(text)) return text;
    return `https://instagram.com/${text.replace(/^@/, "")}`;
}
