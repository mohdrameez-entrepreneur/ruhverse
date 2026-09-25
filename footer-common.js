(function () {
  function mountFooter() {
    const footerMounts = document.querySelectorAll('[data-ruhverse-footer]');
    if (!footerMounts.length) return;

    const footerHtml = `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-col">
            <div class="footer-logo">
              <img src="/assets/RuhVerse.jpg" alt="RuhVerse Logo" width="40" height="40" loading="lazy" decoding="async">
              RuhVerse
            </div>
            <p class="footer-slogan">Illuminating Hearts with Divine Wisdom.</p>
          </div>
          <div class="footer-col">
            <h4>Quick Links</h4>
            <ul class="footer-links">
              <li><a href="/quran">Read Quran</a></li>
              <li><a href="/index.html#prayer">Prayer Times</a></li>
              <li><a href="/index.html#ramadan">Ramadan</a></li>
              <li><a href="/index.html#insights">Insights</a></li>
              <li><a href="#support" class="footer-support-link" id="footer-support-trigger">🕊️ Support RuhVerse</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Legal</h4>
            <ul class="footer-links">
              <li><a href="/terms.html">Terms &amp; Conditions</a></li>
              <li><a href="/privacy.html">Privacy Policy</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Contact Us</h4>
            <ul class="footer-links">
              <li class="footer-contact-row">
                <a class="footer-email-link" href="mailto:ruhversebusiness@gmail.com">ruhversebusiness@gmail.com</a>
                <span class="footer-social-links">
                  <a class="footer-social-link" href="https://www.instagram.com/ruhverse" target="_blank" rel="noopener noreferrer" aria-label="RuhVerse on Instagram">
                    <svg class="footer-social-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
                  </a>
                  <a class="footer-social-link" href="https://www.pinterest.com/ruhverse" target="_blank" rel="noopener noreferrer" aria-label="RuhVerse on Pinterest">
                    <svg class="footer-social-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12.2 2.2c-5.1 0-8.1 3.4-8.1 7.1 0 2.1 1.2 3.6 2.4 3.6.4 0 .6-1.1.6-1.4 0-.4-1-1.2-1-2.8 0-3 2.2-5 5.5-5 3 0 5 1.7 5 4.8 0 2.2-1 6.3-3.8 6.3-1 0-1.9-.7-1.6-1.8.3-1.2.9-2.5.9-3.4 0-.8-.4-1.5-1.3-1.5-1.1 0-1.9 1.1-1.9 2.6 0 .9.3 1.5.3 1.5l-1.2 5c-.3 1.4-.1 3.2 0 4 .1.2.3.2.4 0 .4-.5 1.5-1.9 1.9-3.2l.7-2.8c.5.7 1.4 1.2 2.5 1.2 3.3 0 5.7-3 5.7-7.4 0-3.7-3.1-6.5-7-6.5Z"/></svg>
                  </a>
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          &copy; 2026 RuhVerse. All rights reserved. | Made by <span class="author-name">Mohd Rameez</span>
        </div>
      </div>
    </footer>
    `;

    footerMounts.forEach(function (footerMount) {
      footerMount.outerHTML = footerHtml;
    });
  }

  function mountNavSupport() {
    const navActions = document.querySelector('.nav-actions');
    if (navActions && !document.getElementById('nav-support-trigger')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nav-support-btn';
      btn.id = 'nav-support-trigger';
      btn.setAttribute('aria-label', 'Support RuhVerse');
      btn.title = 'Support RuhVerse';
      btn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
      
      const nightToggle = document.getElementById('night-mode-toggle');
      if (nightToggle && nightToggle.parentNode === navActions) {
        navActions.insertBefore(btn, nightToggle);
      } else {
        navActions.appendChild(btn);
      }
    }

    const mobileMenu = document.querySelector('.nav-links-mobile');
    if (mobileMenu && !document.getElementById('nav-mobile-support-trigger')) {
      const li = document.createElement('li');
      li.className = 'nav-mobile-support-item';
      li.innerHTML = '<a href="#support" class="nav-mobile-support-link" id="nav-mobile-support-trigger"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style="vertical-align: -2px; margin-right: 6px;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>Support RuhVerse</a>';
      
      const loginItem = mobileMenu.querySelector('.nav-mobile-login');
      if (loginItem && loginItem.parentNode === mobileMenu) {
        mobileMenu.insertBefore(li, loginItem);
      } else {
        mobileMenu.appendChild(li);
      }
    }
  }

  function mountSupportModals() {
    if (document.getElementById('ruhverse-transparency-modal')) return;

    const modalContainer = document.createElement('div');
    modalContainer.id = 'ruhverse-support-modals-root';
    modalContainer.innerHTML = `
    <!-- 1. Web Transparency & Permission Alert Modal -->
    <div class="modal ruhverse-support-modal-overlay" id="ruhverse-transparency-modal" aria-hidden="true" role="dialog" aria-labelledby="transparency-modal-title">
      <div class="modal-content transparency-dialog-card">
        <div class="transparency-shield-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
        </div>
        <h3 id="transparency-modal-title" class="transparency-dialog-title">Support RuhVerse</h3>
        <p class="transparency-dialog-subtitle">TRANSPARENCY &amp; PERMISSION</p>

        <div class="transparency-breakdown-box">
          <p class="transparency-breakdown-header">Contributions help cover:</p>
          <ul class="transparency-bullet-list">
            <li><span class="t-bullet-dot">•</span> Hosting &amp; domain costs</li>
            <li><span class="t-bullet-dot">•</span> Development and maintenance</li>
            <li><span class="t-bullet-dot">•</span> Content and infrastructure</li>
            <li><span class="t-bullet-dot">•</span> Compensation for the time required to maintain the project</li>
          </ul>
          <div class="transparency-divider"></div>
          <p class="transparency-disclosure-text">
            &ldquo;A portion of contributions may be used to compensate the developer/maintainer for their time and necessary personal expenses associated with maintaining RuhVerse.&rdquo;
          </p>
        </div>

        <p class="transparency-question-prompt">Do you grant your special permission to proceed?</p>

        <div class="transparency-actions-row">
          <button type="button" class="transparency-decline-btn" id="transparency-decline-btn">Decline</button>
          <button type="button" class="transparency-grant-btn" id="transparency-grant-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 5px; vertical-align: -1px;">
              <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6.4-4.8-6.4 4.8 2.4-7.2-6-4.8h7.6z"/>
            </svg>
            Grant Permission
          </button>
        </div>
      </div>
    </div>

    <!-- 2. Web Support & Keep Ad-Free Modal -->
    <div class="modal ruhverse-support-modal-overlay" id="ruhverse-support-modal" aria-hidden="true" role="dialog" aria-labelledby="support-modal-title">
      <div class="modal-content support-dialog-card">
        <div class="support-dialog-header-row">
          <div class="support-dialog-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
            <span>Transparent &amp; Ad-Free</span>
          </div>
          <button type="button" class="support-dialog-close-btn" id="support-dialog-close-btn" aria-label="Close">&times;</button>
        </div>

        <h3 id="support-modal-title" class="support-dialog-main-title">Support RuhVerse 🕊️</h3>

        <div class="support-scroll-body">
          <!-- UPI Card -->
          <div class="support-box-card">
            <div class="support-box-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
              <h4>Support via UPI</h4>
            </div>
            <div class="support-upi-row">
              <span class="support-upi-code" id="web-upi-val">8287593935@fam</span>
              <button type="button" class="support-copy-pill" id="web-upi-copy-action">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                <span id="web-upi-copy-text">Copy</span>
              </button>
            </div>
            <a href="upi://pay?pa=8287593935@fam&pn=RuhVerse&cu=INR&tn=Support%20RuhVerse%20App" class="support-primary-action-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px;">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              Pay with UPI
            </a>
          </div>

          <!-- Buy Me a Coffee Card -->
          <div class="support-box-card">
            <div class="support-box-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                <line x1="6" y1="1" x2="6" y2="4"/>
                <line x1="10" y1="1" x2="10" y2="4"/>
                <line x1="14" y1="1" x2="14" y2="4"/>
              </svg>
              <h4>International / Buy Me a Coffee</h4>
            </div>
            <p class="support-box-subtitle">Support with Card, Apple Pay, Google Pay, or PayPal from anywhere in the world.</p>
            <a href="https://www.buymeacoffee.com/ruhverse" target="_blank" rel="noopener noreferrer" class="support-gold-action-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px;">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              Support on Buy Me a Coffee
            </a>
          </div>

          <p class="support-bottom-disclaimer">Thank you for keeping RuhVerse independent, transparent, and completely free of commercial advertisements.</p>
        </div>
      </div>
    </div>
    `;
    document.body.appendChild(modalContainer);
  }

  function initSupportHandlers() {
    const transparencyModal = document.getElementById('ruhverse-transparency-modal');
    const supportModal = document.getElementById('ruhverse-support-modal');
    if (!transparencyModal || !supportModal) return;

    function openTransparencyModal() {
      transparencyModal.style.display = 'flex';
      transparencyModal.setAttribute('aria-hidden', 'false');
      supportModal.style.display = 'none';
      supportModal.setAttribute('aria-hidden', 'true');
      document.body.classList.add('modal-open');
    }

    function closeTransparencyModal() {
      transparencyModal.style.display = 'none';
      transparencyModal.setAttribute('aria-hidden', 'true');
      if (supportModal.style.display !== 'flex') {
        document.body.classList.remove('modal-open');
      }
    }

    function openSupportModal() {
      closeTransparencyModal();
      supportModal.style.display = 'flex';
      supportModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
    }

    function closeSupportModal() {
      supportModal.style.display = 'none';
      supportModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
    }

    // Intercept all support clicks
    document.addEventListener('click', function (e) {
      const trigger = e.target.closest('#nav-support-trigger, #footer-support-trigger, #nav-mobile-support-trigger, a[href="#support"], [data-support-trigger]');
      if (trigger) {
        e.preventDefault();
        // If mobile nav overlay is open, close it
        const navOverlay = document.getElementById('nav-overlay');
        if (navOverlay && navOverlay.classList.contains('active')) {
          navOverlay.classList.remove('active');
        }
        openTransparencyModal();
      }
    });

    const declineBtn = document.getElementById('transparency-decline-btn');
    if (declineBtn) {
      declineBtn.addEventListener('click', closeTransparencyModal);
    }

    const grantBtn = document.getElementById('transparency-grant-btn');
    if (grantBtn) {
      grantBtn.addEventListener('click', openSupportModal);
    }

    const closeSupportBtn = document.getElementById('support-dialog-close-btn');
    if (closeSupportBtn) {
      closeSupportBtn.addEventListener('click', closeSupportModal);
    }

    // Close on outside click
    transparencyModal.addEventListener('click', function (e) {
      if (e.target === transparencyModal) closeTransparencyModal();
    });
    supportModal.addEventListener('click', function (e) {
      if (e.target === supportModal) closeSupportModal();
    });

    // Close on ESC
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (supportModal.style.display === 'flex') {
          closeSupportModal();
        } else if (transparencyModal.style.display === 'flex') {
          closeTransparencyModal();
        }
      }
    });

    // Copy UPI ID handler
    const copyBtn = document.getElementById('web-upi-copy-action');
    const upiVal = '8287593935@fam';
    if (copyBtn) {
      copyBtn.addEventListener('click', async function () {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(upiVal);
          } else {
            const temp = document.createElement('textarea');
            temp.value = upiVal;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            document.body.removeChild(temp);
          }
          const label = document.getElementById('web-upi-copy-text');
          if (label) {
            label.textContent = 'Copied!';
            copyBtn.style.color = '#1A4D2E';
            copyBtn.style.borderColor = '#1A4D2E';
            setTimeout(function () {
              label.textContent = 'Copy';
              copyBtn.style.color = '';
              copyBtn.style.borderColor = '';
            }, 3000);
          }
        } catch (err) {}
      });
    }
  }

  function init() {
    mountFooter();
    mountNavSupport();
    mountSupportModals();
    initSupportHandlers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
