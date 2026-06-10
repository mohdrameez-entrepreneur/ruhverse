(function () {
    const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost';

    if ('serviceWorker' in navigator && isSecureContext) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch((err) => {
                console.error('Service worker registration failed:', err);
            });
        });
    }

    let deferredInstallPrompt = null;

    const isStandalone = () => (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true
    );

    const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

    const createInstallButton = () => {
        let button = document.querySelector('[data-pwa-install]');
        if (button) return button;

        button = document.createElement('button');
        button.type = 'button';
        button.className = 'pwa-install-button';
        button.textContent = 'Install app';
        button.setAttribute('data-pwa-install', '');
        button.hidden = true;
        document.body.appendChild(button);
        return button;
    };

    const button = createInstallButton();

    const showInstallButton = () => {
        if (!isStandalone()) {
            button.hidden = false;
        }
    };

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredInstallPrompt = event;
        showInstallButton();
    });

    if (isIos() && !isStandalone()) {
        showInstallButton();
    }

    button.addEventListener('click', async () => {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            await deferredInstallPrompt.userChoice;
            deferredInstallPrompt = null;
            button.hidden = true;
            return;
        }

        if (isIos()) {
            window.alert('Use Share, then Add to Home Screen to install RuhVerse.');
        }
    });

    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        button.hidden = true;
    });
}());
