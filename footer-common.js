(function () {
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
            </ul>
          </div>
          <div class="footer-col">
            <h4>Legal</h4>
            <ul class="footer-links">
              <li><a href="/terms.html">Terms &amp; Conditions</a></li>
              <li><a href="/terms.html">Privacy Policy</a></li>
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
}());
