export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer print:hidden">
      <p className="site-footer-text">
        Made with{' '}
        <span className="site-footer-heart" aria-label="love">❤️</span>
        {' '}by{' '}
        <span className="site-footer-author">Ashutosh Aman</span>
        <span className="site-footer-sep" aria-hidden="true"> · </span>
        <span className="site-footer-year">{year}</span>
        <span className="site-footer-sep" aria-hidden="true"> · </span>
        <span className="site-footer-tagline">Classical Vedic Astrology</span>
      </p>
    </footer>
  );
}
