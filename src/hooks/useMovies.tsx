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

export type Movie = Tables<"movies"> & {
  localPoster?: string;
};

export const useMovies = () => {
  return useQuery({
    queryKey: ["movies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Map poster_url to local assets
      return (data || []).map((movie) => ({
        ...movie,
        localPoster: posterMap[movie.poster_url || ""] || movie.poster_url,
      }));
    },
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

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        localPoster: posterMap[data.poster_url || ""] || data.poster_url,
      };
    },
    enabled: !!id,
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

      if (error) throw error;

      return (data || []).map((movie) => ({
        ...movie,
        localPoster: posterMap[movie.poster_url || ""] || movie.poster_url,
      }));
    },
  });
};
