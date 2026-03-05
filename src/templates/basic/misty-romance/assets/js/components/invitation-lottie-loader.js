(function () {
  if (window.__invitationLottieLoaderInitialized) {
    return;
  }
  window.__invitationLottieLoaderInitialized = true;

  function parseSettings(widget) {
    var raw = widget.getAttribute("data-settings") || "{}";
    try {
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }

  function writeSettings(widget, settings) {
    widget.setAttribute("data-settings", JSON.stringify(settings));
  }

  function applyLottieMap(lottieMap) {
    var widgets = Array.prototype.slice.call(
      document.querySelectorAll("[data-lottie-key]")
    );

    widgets.forEach(function (widget) {
      var key = widget.getAttribute("data-lottie-key");
      var fallback = widget.getAttribute("data-lottie-fallback") || "";
      var src = (lottieMap && lottieMap[key]) || fallback;

      if (!src) {
        return;
      }

      var settings = parseSettings(widget);
      settings.source = "media_file";

      if (!settings.source_json || typeof settings.source_json !== "object") {
        settings.source_json = {};
      }

      settings.source_json.url = src;
      writeSettings(widget, settings);
    });
  }

  function parseLoopValue(loopValue) {
    if (typeof loopValue === "boolean") {
      return loopValue;
    }

    if (typeof loopValue === "string") {
      return loopValue === "yes" || loopValue === "true";
    }

    return true;
  }

  function initFallbackAnimations(lottieMap) {
    var lottieLib = window.lottie || window.bodymovin;
    if (!lottieLib || typeof lottieLib.loadAnimation !== "function") {
      return;
    }

    var widgets = Array.prototype.slice.call(
      document.querySelectorAll("[data-lottie-key]")
    );

    widgets.forEach(function (widget) {
      var key = widget.getAttribute("data-lottie-key");
      var fallback = widget.getAttribute("data-lottie-fallback") || "";
      var mappedSrc = (lottieMap && lottieMap[key]) || fallback;
      var settings = parseSettings(widget);
      var src =
        mappedSrc ||
        (settings.source_json && settings.source_json.url) ||
        "";

      if (!src) {
        return;
      }

      var container = widget.querySelector(".e-lottie__animation");
      if (!container) {
        return;
      }

      // Skip if already rendered by Elementor with same source.
      if (
        container.dataset.invitationLottieSrc === src &&
        container.childElementCount > 0
      ) {
        return;
      }

      if (
        container.childElementCount > 0 &&
        !container.dataset.invitationLottieFallback
      ) {
        return;
      }

      if (
        container.__invitationLottieInstance &&
        typeof container.__invitationLottieInstance.destroy === "function"
      ) {
        container.__invitationLottieInstance.destroy();
      }

      container.innerHTML = "";
      container.__invitationLottieInstance = lottieLib.loadAnimation({
        container: container,
        renderer: settings.renderer || "svg",
        loop: parseLoopValue(settings.loop),
        autoplay: true,
        path: src,
      });
      container.dataset.invitationLottieSrc = src;
      container.dataset.invitationLottieFallback = "1";
      widget.classList.remove("elementor-invisible");
    });
  }

  var store = window.__invitationMediaStore;
  var fallbackLottieMap = {
    bird_hitam_1: "/assets/bird-hitam-1-1-1.json",
  };

  function getCurrentLottieMap() {
    if (!store || typeof store.getCurrent !== "function") {
      return Object.assign({}, fallbackLottieMap);
    }

    var current = store.getCurrent() || {};
    return Object.assign({}, fallbackLottieMap, current.lotties || {});
  }

  // Run immediately so Elementor handlers read local paths during init.
  applyLottieMap(getCurrentLottieMap());
  initFallbackAnimations(getCurrentLottieMap());

  document.addEventListener("DOMContentLoaded", async function () {
    var currentMap = getCurrentLottieMap();
    applyLottieMap(currentMap);
    initFallbackAnimations(currentMap);

    if (store && typeof store.load === "function") {
      var remoteMedia = await store.load();
      var mergedMap = Object.assign(
        {},
        fallbackLottieMap,
        (remoteMedia || {}).lotties || {}
      );
      applyLottieMap(mergedMap);
      initFallbackAnimations(mergedMap);
    }
  });

  document.addEventListener("elementor/frontend/init", function () {
    var map = getCurrentLottieMap();
    applyLottieMap(map);
    initFallbackAnimations(map);
  });

  window.addEventListener("load", function () {
    var attempts = 0;
    var timer = setInterval(function () {
      attempts += 1;
      var map = getCurrentLottieMap();
      applyLottieMap(map);
      initFallbackAnimations(map);

      if (attempts >= 20) {
        clearInterval(timer);
      }
    }, 250);
  });
})();
