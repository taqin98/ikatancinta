(function () {
  if (window.__invitationMediaStore) {
    return;
  }

  var DEFAULT_MEDIA = {
    videos: {
      waterfall_main: "/assets/audio/waterfall2.mp4",
    },
    audios: {
      main_theme:
        "/assets/audio/Percy-Faith-His-Orchestra-A-Summer-Place-1959__Wd3dlEvodk-1.mp3",
    },
    lotties: {
      bird_hitam_1: "/assets/bird-hitam-1-1-1.json",
    },
  };

  var API_URL = (window.INVITATION_ASSET_API_URL || "").trim();
  var current = {
    videos: Object.assign({}, DEFAULT_MEDIA.videos),
    audios: Object.assign({}, DEFAULT_MEDIA.audios),
    lotties: Object.assign({}, DEFAULT_MEDIA.lotties),
  };
  var loadPromise = null;

  function normalizeMediaPayload(payload) {
    if (!payload || typeof payload !== "object") {
      return null;
    }

    if (payload.videos || payload.audios || payload.lotties) {
      return {
        videos: payload.videos || {},
        audios: payload.audios || {},
        lotties: payload.lotties || {},
      };
    }

    var videos = {};
    var audios = {};
    var lotties = {};

    if (payload.waterfall_main || payload.background_video || payload.main_video) {
      videos.waterfall_main =
        payload.waterfall_main || payload.background_video || payload.main_video;
    }

    if (payload.main_theme || payload.background_audio || payload.audio) {
      audios.main_theme =
        payload.main_theme || payload.background_audio || payload.audio;
    }

    if (
      payload.bird_hitam_1 ||
      payload.bird_hitam_1_1_1 ||
      payload.bird_black ||
      payload.lottie
    ) {
      lotties.bird_hitam_1 =
        payload.bird_hitam_1 ||
        payload.bird_hitam_1_1_1 ||
        payload.bird_black ||
        payload.lottie;
    }

    if (
      !Object.keys(videos).length &&
      !Object.keys(audios).length &&
      !Object.keys(lotties).length
    ) {
      return null;
    }

    return { videos: videos, audios: audios, lotties: lotties };
  }

  function mergeMedia(baseMedia, overrideMedia) {
    return {
      videos: Object.assign({}, baseMedia.videos || {}, overrideMedia.videos || {}),
      audios: Object.assign({}, baseMedia.audios || {}, overrideMedia.audios || {}),
      lotties: Object.assign(
        {},
        baseMedia.lotties || {},
        overrideMedia.lotties || {}
      ),
    };
  }

  function cloneCurrent() {
    return {
      videos: Object.assign({}, current.videos),
      audios: Object.assign({}, current.audios),
      lotties: Object.assign({}, current.lotties),
    };
  }

  async function loadRemote() {
    if (!API_URL) {
      return cloneCurrent();
    }

    try {
      var response = await fetch(API_URL, { cache: "no-store" });
      if (!response.ok) {
        return cloneCurrent();
      }

      var payload = await response.json();
      var normalized = normalizeMediaPayload(payload);
      if (!normalized) {
        return cloneCurrent();
      }

      current = mergeMedia(current, normalized);
      return cloneCurrent();
    } catch (e) {
      return cloneCurrent();
    }
  }

  function load() {
    if (!loadPromise) {
      loadPromise = loadRemote();
    }
    return loadPromise;
  }

  window.__invitationMediaStore = {
    getCurrent: function () {
      return cloneCurrent();
    },
    load: load,
  };
})();
