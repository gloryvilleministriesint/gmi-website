// Load a YouTube player only when the visitor presses play (privacy-enhanced mode, no autoplay on page load).
export function initYouTube(scope: ParentNode = document) {
  scope.querySelectorAll<HTMLButtonElement>('button[data-yt]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.className = 'yt-frame';
      iframe.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.yt}?autoplay=1&rel=0`;
      iframe.title = btn.dataset.title ?? 'Video';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      btn.replaceWith(iframe);
      iframe.focus();
    });
  });
}
