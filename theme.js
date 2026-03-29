(() => {
    const STORAGE_KEY = 'ruhverse-theme';
    const DARK_VALUE = 'dark';

    function readStoredTheme() {
        try {
            return localStorage.getItem(STORAGE_KEY) === DARK_VALUE;
        } catch (_) {
            return false;
        }
    }

    function persistTheme(isDark) {
        try {
            if (isDark) {
                localStorage.setItem(STORAGE_KEY, DARK_VALUE);
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch (_) {
            // Ignore storage failures in restricted environments.
        }
    }

    function getCurrentThemeState() {
        return document.body.classList.contains('dark-mode');
    }

    function updateToggleVisuals(isDark) {
        const toggles = document.querySelectorAll('[data-theme-toggle], #night-mode-toggle');
        toggles.forEach((toggle) => {
            toggle.setAttribute('aria-pressed', String(isDark));

            if (toggle.classList.contains('floating-theme-toggle')) {
                toggle.textContent = isDark ? '☀' : '☾';
            }

            if (toggle.id === 'night-mode-toggle') {
                const isSingleIcon =
                    toggle.childElementCount === 0 &&
                    (toggle.textContent || '').trim().length <= 2;
                if (isSingleIcon) {
                    toggle.textContent = isDark ? '☀' : '☾';
                }
            }
        });
    }

    function applyTheme(isDark) {
        if (!document.body) return;
        document.body.classList.toggle('dark-mode', isDark);
        updateToggleVisuals(isDark);
    }

    function setTheme(isDark) {
        applyTheme(isDark);
        persistTheme(isDark);
    }

    function bindToggle(toggle) {
        if (!toggle || toggle.dataset.themeManaged === '1') return;
        toggle.dataset.themeManaged = '1';
        if (!toggle.hasAttribute('data-theme-toggle')) {
            toggle.setAttribute('data-theme-toggle', '');
        }
        if (!toggle.hasAttribute('type') && toggle.tagName.toLowerCase() === 'button') {
            toggle.setAttribute('type', 'button');
        }
        toggle.setAttribute('aria-label', 'Toggle dark mode');

        toggle.addEventListener('click', () => {
            setTheme(!getCurrentThemeState());
        });
    }

    function ensureToggleExists() {
        const existingToggles = document.querySelectorAll('[data-theme-toggle], #night-mode-toggle');
        if (existingToggles.length) {
            existingToggles.forEach(bindToggle);
            return;
        }

        const floatingToggle = document.createElement('button');
        floatingToggle.id = 'floating-theme-toggle';
        floatingToggle.className = 'floating-theme-toggle';
        floatingToggle.setAttribute('data-theme-toggle', '');
        document.body.appendChild(floatingToggle);
        bindToggle(floatingToggle);
    }

    function initTheme() {
        applyTheme(readStoredTheme());
        ensureToggleExists();
        updateToggleVisuals(getCurrentThemeState());
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }

    window.RuhVerseTheme = {
        bindToggle,
        applyTheme,
        setTheme
    };
})();
