import { useState } from "react";
import { useMovies } from "@/hooks/useMovies";
import MovieCard from "./MovieCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BookingModal from "./BookingModal";
import type { Movie } from "@/hooks/useMovies";

const genres = [
  "All",
  "Action",
  "Comedy",
  "Drama",
  "Horror",
  "Romance",
  "Sci-Fi",
  "Animation",
  "Thriller",
  "Adventure",
  "Family",
  "Sports",
  "Mystery",
];

const MovieListings = () => {
  const { data: movies, isLoading } = useMovies();
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const filteredMovies = selectedGenre === "All"
    ? movies
    : movies?.filter((movie) => movie.genre?.includes(selectedGenre));

  const handleBookNow = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsBookingOpen(true);
  };

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Now Showing
            </h2>
            <p className="text-muted-foreground mt-1">
              Book tickets for the latest movies
            </p>
          </div>
        </div>

        {/* Genre Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {genres.slice(0, 8).map((genre) => (
            <Button
              key={genre}
              variant={selectedGenre === genre ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedGenre(genre)}
              className="whitespace-nowrap flex-shrink-0"
            >
              {genre}
            </Button>
          ))}
        </div>

        {/* Movies Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[2/3] rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {filteredMovies?.map((movie, index) => (
              <div
                key={movie.id}
                style={{ animationDelay: `${index * 100}ms` }}
                className="opacity-0 animate-fade-in"
              >
                <MovieCard movie={movie} onBookNow={() => handleBookNow(movie)} />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredMovies?.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No movies found in this category
            </p>
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => setSelectedGenre("All")}
            >
              View all movies
            </Button>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal
        movie={selectedMovie}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </section>
  );
};

export default MovieListings;
