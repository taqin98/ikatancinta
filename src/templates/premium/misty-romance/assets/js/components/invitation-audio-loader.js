(function () {
  if (window.__invitationAudioLoaderInitialized) {
    return;
  }
  window.__invitationAudioLoaderInitialized = true;

  function applyAudioMap(audioMap) {
    var sources = Array.prototype.slice.call(
      document.querySelectorAll("source[data-audio-key]")
    );

    var audioElements = [];

    sources.forEach(function (source) {
      var key = source.getAttribute("data-audio-key");
      var fallback = source.getAttribute("data-audio-fallback") || "";
      var src = (audioMap && audioMap[key]) || fallback;

      if (!src) {
        return;
      }

      var sourceChanged = source.getAttribute("src") !== src;
      if (sourceChanged) {
        source.setAttribute("src", src);
      }

      var audio = source.closest("audio");
      if (!audio) {
        return;
      }

      if (audioElements.indexOf(audio) === -1) {
        if (sourceChanged || !audio.currentSrc) {
          audio.load();
        }
        audioElements.push(audio);
      }
    });

    return audioElements;
  }

  function tryAutoplayAudios(audios) {
    if (!window.settingAutoplay) {
      return;
    }

    (audios || []).forEach(function (audio) {
      if (!audio || !audio.paused) {
        return;
      }

      var playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          // Ignore autoplay restrictions until user interacts.
        });
      }
    });
  }

  function bindOpenButton(openButton, audios) {
    if (!openButton || !audios.length) {
      return;
    }

    openButton.addEventListener("click", function () {
      audios.forEach(function (audio) {
        if (!audio || !audio.paused) {
          return;
        }

        var playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function () {
            // Ignore autoplay restrictions until user interacts.
          });
        }
      });
    });
  }

  var store = window.__invitationMediaStore;
  if (!store) {
    return;
  }

  // Apply early so existing jQuery ready logic sees a valid source.
  applyAudioMap(store.getCurrent().audios);

  document.addEventListener("DOMContentLoaded", async function () {
    var openButton = document.getElementById("open");
    var initialAudios = applyAudioMap(store.getCurrent().audios);

    bindOpenButton(openButton, initialAudios);
    tryAutoplayAudios(initialAudios);

    var remoteMedia = await store.load();
    var updatedAudios = applyAudioMap(remoteMedia.audios);
    tryAutoplayAudios(updatedAudios);
  });
})();
