import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, Play } from "lucide-react";
import { Movie } from "@/data/movies";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FeaturedCarouselProps {
  movies: Movie[];
}

const FeaturedCarousel = ({ movies }: FeaturedCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % movies.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentMovie = movies[currentIndex];

  return (
    <div className="relative h-[70vh] min-h-[500px] max-h-[700px] overflow-hidden bg-background">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={currentMovie.poster}
          alt={currentMovie.title}
          className="w-full h-full object-cover opacity-30 blur-sm scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 h-full flex items-center">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 w-full">
          {/* Movie Poster */}
          <div className="flex-shrink-0 w-48 md:w-64 animate-scale-in">
            <div className="relative rounded-2xl overflow-hidden shadow-glow">
              <img
                src={currentMovie.poster}
                alt={currentMovie.title}
                className="w-full aspect-[2/3] object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-background/50">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center animate-pulse-glow">
                  <Play className="w-8 h-8 text-primary-foreground fill-current ml-1" />
                </div>
              </div>
            </div>
          </div>

          {/* Movie Details */}
          <div className="flex-1 text-center md:text-left animate-fade-in">
            <Badge variant="default" className="mb-4">
              Now Showing
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              {currentMovie.title}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
              <div className="flex items-center gap-1 text-primary">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-semibold">{currentMovie.rating}/10</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{currentMovie.duration}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{currentMovie.language}</span>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
              {currentMovie.genre.map((g) => (
                <Badge key={g} variant="secondary">
                  {g}
                </Badge>
              ))}
            </div>
            <Button size="lg" className="font-semibold">
              Book Tickets
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-secondary/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-secondary/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {movies.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? "w-8 bg-primary"
                : "bg-muted-foreground/50 hover:bg-muted-foreground"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default FeaturedCarousel;
