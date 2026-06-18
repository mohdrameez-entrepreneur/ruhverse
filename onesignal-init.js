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
  });
})();
