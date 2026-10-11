/** TMDB's required attribution for apps using its API. */
export function TmdbCredit() {
  return (
    <p className="py-4 text-xs text-faint">
      Movie data and images from{" "}
      <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
        TMDB
      </a>
      . This product uses the TMDB API but is not endorsed or certified by TMDB.
    </p>
  );
}
