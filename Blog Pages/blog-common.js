(function () {
  const shareBtn = document.getElementById('share-article-btn');
  const shareStatus = document.getElementById('share-article-status');
  if (!shareBtn || !shareStatus) return;

  shareBtn.addEventListener('click', async function () {
    const canonicalEl = document.querySelector('link[rel="canonical"]');
    const canonicalHref = canonicalEl ? canonicalEl.getAttribute('href') : '';
    const shareUrl = canonicalHref
      ? new URL(canonicalHref, window.location.origin).href
      : window.location.href;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const shareData = {
      title: ogTitle && ogTitle.content ? ogTitle.content : document.title,
      text: 'Read this article on RuhVerse',
      url: shareUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        shareStatus.textContent = 'Shared successfully.';
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        shareStatus.textContent = 'Link copied. Share it anywhere.';
        return;
      }

      shareStatus.textContent = 'Copy the URL from the address bar to share.';
    } catch (error) {
      shareStatus.textContent = 'Share cancelled.';
    }
  });
}());
