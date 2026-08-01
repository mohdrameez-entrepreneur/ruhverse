(function () {
  window.OneSignalDeferred = window.OneSignalDeferred || [];

  window.OneSignalDeferred.push(async function (OneSignal) {
    const canUseNotifications = 'Notification' in window;
    let notificationButton = null;

    const setNotificationButtonState = function () {
      if (!notificationButton) return;

      if (!canUseNotifications) {
        notificationButton.hidden = true;
        return;
      }

      notificationButton.hidden = false;
      notificationButton.classList.toggle('is-enabled', Notification.permission === 'granted');
      notificationButton.setAttribute(
        'aria-label',
        Notification.permission === 'granted'
          ? 'Notifications are enabled'
          : 'Enable notifications'
      );
      notificationButton.title = Notification.permission === 'granted'
        ? 'Notifications enabled'
        : 'Enable notifications';
    };

    const createNotificationButton = function (onClick) {
      if (document.querySelector('[data-notification-subscribe]')) {
        notificationButton = document.querySelector('[data-notification-subscribe]');
        notificationButton.addEventListener('click', onClick);
        setNotificationButtonState();
        return;
      }

      const style = document.createElement('style');
      style.textContent = [
        '.ruh-notification-button{position:fixed;right:22px;bottom:22px;width:54px;height:54px;border:0;border-radius:50%;background:#1a4d2e;color:#fff;box-shadow:0 12px 28px rgba(0,0,0,.22);cursor:pointer;z-index:2147483000;display:grid;place-items:center;font-size:24px;line-height:1;transition:transform .2s ease,background .2s ease;}',
        '.ruh-notification-button:hover{transform:translateY(-2px);background:#23663e;}',
        '.ruh-notification-button.is-enabled{background:#d4af37;color:#17351f;}',
        '.ruh-notification-button[hidden]{display:none;}'
      ].join('');
      document.head.appendChild(style);

      notificationButton = document.createElement('button');
      notificationButton.type = 'button';
      notificationButton.className = 'ruh-notification-button';
      notificationButton.textContent = '🔔';
      notificationButton.setAttribute('data-notification-subscribe', '');
      notificationButton.addEventListener('click', onClick);
      document.body.appendChild(notificationButton);
      setNotificationButtonState();
    };

    let oneSignalReady = false;

    try {
      await OneSignal.init({
      appId: 'd1feb8cc-5929-42b8-a78f-55455c3f6613',
      safari_web_id: 'web.onesignal.auto.69a0d04c-4cfa-4f80-8d34-652264ce8748',
      serviceWorkerPath: '/push/onesignal/OneSignalSDKWorker.js',
      serviceWorkerParam: { scope: '/push/onesignal/' },
      notifyButton: {
        enable: true,
        size: 'medium',
        position: 'bottom-right',
        prenotify: true,
        showCredit: false,
        displayPredicate: function () {
          return true;
        }
      },
      promptOptions: {
        slidedown: {
          prompts: [
            {
              type: 'push',
              autoPrompt: true,
              delay: {
                pageViews: 1,
                timeDelay: 2
              },
              text: {
                actionMessage: 'Allow RuhVerse notifications for prayer reminders and new Islamic content.',
                acceptButton: 'Allow',
                cancelButton: 'Later'
              }
            }
          ]
        }
      },
      allowLocalhostAsSecureOrigin: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      });
      oneSignalReady = true;
    } catch (error) {
      console.warn('OneSignal could not be initialized.', error);
    }

    let promptRequested = false;
    const requestPushPermission = async function (forcePrompt) {
      if (!forcePrompt && promptRequested) return;

      try {
        if (window.Notification && Notification.permission === 'denied') {
          promptRequested = true;
          window.alert('Notifications are blocked. Please allow RuhVerse notifications from your browser site settings.');
          return;
        }

        const alreadyPrompted = window.Notification && Notification.permission === 'granted';
        if (alreadyPrompted) {
          promptRequested = true;
          return;
        }

        if (oneSignalReady && OneSignal.Slidedown && typeof OneSignal.Slidedown.promptPush === 'function') {
          await OneSignal.Slidedown.promptPush(forcePrompt ? { force: true } : undefined);
          promptRequested = true;
          return;
        }

        if (oneSignalReady && OneSignal.Notifications && typeof OneSignal.Notifications.requestPermission === 'function') {
          await OneSignal.Notifications.requestPermission();
          promptRequested = true;
          return;
        }

        if (Notification.requestPermission) {
          await Notification.requestPermission();
          promptRequested = true;
        }
      } catch (error) {
        if (window.Notification && Notification.permission !== 'default') {
          promptRequested = true;
        }
        console.warn('Notification permission prompt could not be shown.', error);
        window.alert('Please allow notifications from your browser site settings to receive RuhVerse updates.');
      } finally {
        setNotificationButtonState();
      }
    };

    window.setTimeout(async function () {
      await requestPushPermission(false);
    }, 1200);

    document.addEventListener('click', function () {
      requestPushPermission(true);
    }, { once: true });
    createNotificationButton(function () {
      requestPushPermission(true);
    });
  });
})();
