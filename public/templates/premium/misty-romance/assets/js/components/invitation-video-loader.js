(function () {
  if (window.__invitationVideoLoaderInitialized) {
    return;
  }
  window.__invitationVideoLoaderInitialized = true;

  function parseSettings(container) {
    var raw = container.getAttribute("data-settings") || "{}";
    try {
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }

  function writeSettings(container, settings) {
    container.setAttribute("data-settings", JSON.stringify(settings));
  }

  function setHostedVideo(container, src) {
    var video = container.querySelector(
      ".elementor-background-video-hosted, .elementor-background-video-container video"
    );

    if (!video || !src) {
      return null;
    }

    video.removeAttribute("autoplay");

    if (video.getAttribute("src") !== src) {
      video.setAttribute("src", src);
      video.src = src;
      video.load();
    }

    return video;
  }

  function applyVideoMap(videoMap) {
    var containers = Array.prototype.slice.call(
      document.querySelectorAll("[data-bg-video-key]")
    );

    var hostedVideos = [];

    containers.forEach(function (container) {
      var key = container.getAttribute("data-bg-video-key");
      var fallback = container.getAttribute("data-bg-video-fallback") || "";
      var src = (videoMap && videoMap[key]) || fallback;

      if (!src) {
        return;
      }

      var settings = parseSettings(container);
      settings.background_background = "video";
      settings.background_video_link = src;
      if (!settings.background_play_on_mobile) {
        settings.background_play_on_mobile = "yes";
      }
      writeSettings(container, settings);

      var hostedVideo = setHostedVideo(container, src);
      if (hostedVideo) {
        hostedVideos.push(hostedVideo);
      }
    });

    return hostedVideos;
  }

  function bindOpenButton(openButton, videos) {
    if (!openButton || !videos.length) {
      return;
    }

    openButton.addEventListener("click", function () {
      videos.forEach(function (video) {
        if (!video || !video.paused) {
          return;
        }

        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function () {
            // Ignore autoplay restrictions until user interacts.
          });
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", async function () {
    var store = window.__invitationMediaStore;
    if (!store) {
      return;
    }

    var openButton = document.getElementById("open");
    var initialMedia = store.getCurrent();
    var hostedVideos = applyVideoMap(initialMedia.videos);

    hostedVideos.forEach(function (hostedVideo) {
      hostedVideo.addEventListener(
        "loadeddata",
        function () {
          if (openButton) {
            openButton.classList.add("btnVisibleAfterLoad");
          }
        },
        { once: true }
      );
    });

    if (openButton) {
      setTimeout(function () {
        openButton.classList.add("btnVisibleAfterLoad");
      }, 15000);
    }

    bindOpenButton(openButton, hostedVideos);

    var remoteMedia = await store.load();
    applyVideoMap(remoteMedia.videos);
  });
})();
