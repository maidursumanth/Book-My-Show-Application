import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

// Import local movie posters
import movie1 from "@/assets/movies/movie1.jpg";
import movie2 from "@/assets/movies/movie2.jpg";
import movie3 from "@/assets/movies/movie3.jpg";
import movie4 from "@/assets/movies/movie4.jpg";
import movie5 from "@/assets/movies/movie5.jpg";
import movie6 from "@/assets/movies/movie6.jpg";

const posterMap: Record<string, string> = {
  movie1,
  movie2,
  movie3,
  movie4,
  movie5,
  movie6,
};

// Fallback local movie data when DB is unreachable
const fallbackMovies: Movie[] = [
  { id: "local-1", title: "Shadow Strike", poster_url: "movie1", genre: ["Action", "Thriller"], rating: 8.5, language: "English", release_date: "2025-01-15", duration: "2h 15m", is_active: true, description: null, created_at: "", updated_at: "", localPoster: movie1 },
  { id: "local-2", title: "Paris Hearts", poster_url: "movie2", genre: ["Romance", "Comedy"], rating: 7.8, language: "English", release_date: "2025-01-20", duration: "1h 55m", is_active: true, description: null, created_at: "", updated_at: "", localPoster: movie2 },
  { id: "local-3", title: "The Haunting", poster_url: "movie3", genre: ["Horror", "Mystery"], rating: 7.2, language: "English", release_date: "2025-01-10", duration: "2h 05m", is_active: true, description: null, created_at: "", updated_at: "", localPoster: movie3 },
  { id: "local-4", title: "Magic Kingdom", poster_url: "movie4", genre: ["Animation", "Family"], rating: 8.9, language: "English", release_date: "2025-01-25", duration: "1h 45m", is_active: true, description: null, created_at: "", updated_at: "", localPoster: movie4 },
  { id: "local-5", title: "Galactic Voyage", poster_url: "movie5", genre: ["Sci-Fi", "Adventure"], rating: 8.1, language: "English", release_date: "2025-02-01", duration: "2h 30m", is_active: true, description: null, created_at: "", updated_at: "", localPoster: movie5 },
  { id: "local-6", title: "The Champion", poster_url: "movie6", genre: ["Drama", "Sports"], rating: 8.7, language: "English", release_date: "2025-01-28", duration: "2h 10m", is_active: true, description: null, created_at: "", updated_at: "", localPoster: movie6 },
];

export type Movie = Tables<"movies"> & {
  localPoster?: string;
};

const mapMoviePoster = (movie: Tables<"movies">): Movie => ({
  ...movie,
  localPoster: posterMap[movie.poster_url || ""] || movie.poster_url,
});

export const useMovies = () => {
  return useQuery({
    queryKey: ["movies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Failed to fetch movies from DB, using fallback:", error.message);
        return fallbackMovies;
      }

      if (!data || data.length === 0) return fallbackMovies;

      return data.map(mapMoviePoster);
    },
    retry: 1,
  });
};

export const useMovie = (id: string) => {
  return useQuery({
    queryKey: ["movie", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        const fallback = fallbackMovies.find((m) => m.id === id);
        return fallback || null;
      }
      if (!data) return null;

      return mapMoviePoster(data);
    },
    enabled: !!id,
    retry: 1,
  });
};

export const useFeaturedMovies = () => {
  return useQuery({
    queryKey: ["featured-movies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("is_active", true)
        .order("rating", { ascending: false })
        .limit(3);

      if (error) {
        console.warn("Failed to fetch featured movies, using fallback:", error.message);
        return fallbackMovies.slice(0, 3);
      }

      if (!data || data.length === 0) return fallbackMovies.slice(0, 3);

      return data.map(mapMoviePoster);
    },
    retry: 1,
  });
};
