/**
 * TMDB attribution, required by section 3 of the TMDB API terms: the TMDB logo
 * (kept smaller than Wraparty's own mark) plus this exact notice. The logo is
 * TMDB's official "blue short" mark, served from public/ as an image so its
 * gradient doesn't need inline styles (blocked by the nonce CSP).
 */
export function TmdbCredit() {
  return (
    <div className="flex flex-col gap-2 py-4">
      <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="self-start">
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, see comment above */}
        <img src="/tmdb-logo.svg" alt="TMDB" width={92} height={12} className="h-3 w-auto" />
      </a>
      <p className="text-xs text-faint">
        This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.
      </p>
    </div>
  );
}
