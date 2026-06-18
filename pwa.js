(function () {
    const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost';
    const SNOOZE_KEY = 'ruhverseInstallPromptSnoozedUntilV5';
    const SNOOZE_MS = 1000 * 60 * 60 * 24 * 7;

    if ('serviceWorker' in navigator && isSecureContext) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch((err) => {
                console.error('Service worker registration failed:', err);
            });
        });
    }

    let deferredInstallPrompt = null;
    let installPromptShown = false;

    const isStandalone = () => (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true
    );

    const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isMobile = () => /android|iphone|ipad|ipod/i.test(window.navigator.userAgent);

    const getSnoozedUntil = () => {
        try {
            return Number(window.localStorage.getItem(SNOOZE_KEY) || 0);
        } catch (err) {
            console.error('Install prompt storage read failed:', err);
            return 0;
        }
    };

    const isPromptSnoozed = () => Date.now() < getSnoozedUntil();

    const snoozePrompt = () => {
        try {
            window.localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
        } catch (err) {
            console.error('Install prompt storage write failed:', err);
        }
    };

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

    const createNavbarInstallButton = () => {
        let button = document.querySelector('[data-pwa-nav-install]');
        if (button) return button;

        button = document.createElement('button');
        button.type = 'button';
        button.className = 'nav-install-btn';
        button.textContent = 'Install';
        button.setAttribute('data-pwa-nav-install', '');
        button.hidden = true;

        const navActions = document.querySelector('.nav-actions');
        if (navActions) {
            navActions.insertBefore(button, navActions.firstChild);
            return button;
        }

        const navLinks = document.querySelector('.navbar .nav-links');
        if (navLinks) {
            const item = document.createElement('li');
            item.className = 'nav-install-item';
            item.appendChild(button);
            navLinks.appendChild(item);
            return button;
        }

        document.body.appendChild(button);
        return button;
    };

    const createInstallDialog = () => {
        let dialog = document.querySelector('[data-pwa-install-dialog]');
        if (dialog) return dialog;

        dialog = document.createElement('div');
        dialog.className = 'pwa-install-dialog';
        dialog.setAttribute('data-pwa-install-dialog', '');
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'pwa-install-title');
        dialog.hidden = true;
        dialog.innerHTML = [
            '<div class="pwa-install-card">',
            '<h2 id="pwa-install-title">Install RuhVerse</h2>',
            '<p data-pwa-install-copy>Use RuhVerse like an app with faster access from your home screen.</p>',
            '<div class="pwa-install-actions">',
            '<button type="button" class="pwa-install-primary" data-pwa-install-confirm>Install app</button>',
            '<button type="button" class="pwa-install-secondary" data-pwa-install-later>I will install later</button>',
            '</div>',
            '</div>'
        ].join('');
        document.body.appendChild(dialog);
        return dialog;
    };

    const floatingButton = createInstallButton();
    const navbarButton = createNavbarInstallButton();
    const dialog = createInstallDialog();
    const dialogCopy = dialog.querySelector('[data-pwa-install-copy]');
    const confirmButton = dialog.querySelector('[data-pwa-install-confirm]');
    const laterButton = dialog.querySelector('[data-pwa-install-later]');

    const showInstallButton = () => {
        if (!isStandalone()) {
            floatingButton.hidden = false;
            navbarButton.hidden = false;
        }
    };

    const hideInstallButtons = () => {
        floatingButton.hidden = true;
        navbarButton.hidden = true;
    };

    const showInstallDialog = () => {
        if (isStandalone() || installPromptShown || isPromptSnoozed()) return;
        installPromptShown = true;
        dialogCopy.textContent = isMobile()
            ? 'Add RuhVerse to your home screen for quick access without opening the browser first.'
            : 'Install RuhVerse on this device for quick access from your desktop or app launcher.';
        dialog.hidden = false;
    };

    const scheduleInstallPrompt = () => {
        if (isStandalone()) return;
        showInstallButton();
        window.setTimeout(showInstallDialog, 800);
    };

    const hideInstallDialog = () => {
        dialog.hidden = true;
    };

    const runInstallFlow = async () => {
        hideInstallDialog();

        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            await deferredInstallPrompt.userChoice;
            deferredInstallPrompt = null;
            hideInstallButtons();
            return;
        }

        if (isIos()) {
            window.alert('Use Share, then Add to Home Screen to install RuhVerse.');
            return;
        }

        window.alert('Use your browser menu and choose Install app or Add to Home screen to install RuhVerse.');
    };

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredInstallPrompt = event;
        showInstallButton();
        window.setTimeout(showInstallDialog, 800);
    });

    if (isIos() && !isStandalone()) {
        scheduleInstallPrompt();
    }

    if (document.readyState === 'complete') {
        scheduleInstallPrompt();
    } else {
        window.addEventListener('load', scheduleInstallPrompt, { once: true });
        window.setTimeout(scheduleInstallPrompt, 2000);
    }

    floatingButton.addEventListener('click', runInstallFlow);
    navbarButton.addEventListener('click', runInstallFlow);
    confirmButton.addEventListener('click', runInstallFlow);

    laterButton.addEventListener('click', () => {
        snoozePrompt();
        hideInstallDialog();
    });

    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        hideInstallDialog();
        hideInstallButtons();
    });
}());
