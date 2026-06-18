(function () {
  window.OneSignalDeferred = window.OneSignalDeferred || [];

  window.OneSignalDeferred.push(async function (OneSignal) {
    await OneSignal.init({
      appId: '31aeb5c9-708a-4537-a231-90f50698b926',
      safari_web_id: 'web.onesignal.auto.69a0d04c-4cfa-4f80-8d34-652264ce8748',
      serviceWorkerPath: 'push/onesignal/OneSignalSDKWorker.js',
      serviceWorkerParam: { scope: '/push/onesignal/' },
      notifyButton: {
        enable: true
      },
      allowLocalhostAsSecureOrigin: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    });

    window.setTimeout(async function () {
      try {
        const alreadyPrompted = window.Notification && Notification.permission !== 'default';
        if (alreadyPrompted) return;

        if (OneSignal.Slidedown && typeof OneSignal.Slidedown.promptPush === 'function') {
          await OneSignal.Slidedown.promptPush();
          return;
        }

        if (OneSignal.Notifications && typeof OneSignal.Notifications.requestPermission === 'function') {
          await OneSignal.Notifications.requestPermission();
        }
      } catch (_) {
        // Browsers may block automatic native prompts; OneSignal can prompt again after user interaction.
      }
    }, 1200);
  });
})();
