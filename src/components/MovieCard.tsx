import { Star } from "lucide-react";
import { Movie } from "@/data/movies";
import { Badge } from "@/components/ui/badge";

interface MovieCardProps {
  movie: Movie;
}

const MovieCard = ({ movie }: MovieCardProps) => {
  return (
    <div className="group cursor-pointer animate-fade-in">
      {/* Poster Container */}
      <div className="relative overflow-hidden rounded-xl bg-card shadow-card transition-all duration-300 group-hover:shadow-glow group-hover:scale-[1.02]">
        {/* Poster Image */}
        <div className="aspect-[2/3] overflow-hidden">
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>

        {/* Rating Badge */}
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md">
            <Star className="w-3 h-3 fill-primary text-primary" />
            <span className="text-xs font-semibold text-foreground">{movie.rating}</span>
          </div>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Hover Details */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <p className="text-sm text-muted-foreground">{movie.duration} • {movie.language}</p>
        </div>
      </div>

      {/* Movie Info */}
      <div className="mt-3 space-y-2">
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {movie.title}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {movie.genre.map((g) => (
            <Badge key={g} variant="secondary" className="text-xs">
              {g}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
