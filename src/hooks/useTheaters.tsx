import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Theater = Tables<"theaters">;
export type Showtime = Tables<"showtimes"> & {
  theaters?: Theater;
};

export const useTheaters = () => {
  return useQuery({
    queryKey: ["theaters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("theaters")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });
};

export const useShowtimesByMovie = (movieId: string, date: Date) => {
  const dateString = date.toISOString().split("T")[0];
  
  return useQuery({
    queryKey: ["showtimes", movieId, dateString],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("showtimes")
        .select(`
          *,
          theaters (*)
        `)
        .eq("movie_id", movieId)
        .eq("show_date", dateString)
        .eq("is_active", true)
        .order("show_time");

      if (error) throw error;
      return data || [];
    },
    enabled: !!movieId,
  });
};

// Group showtimes by theater
export const groupShowtimesByTheater = (showtimes: Showtime[]) => {
  const grouped: Record<string, { theater: Theater; showtimes: Showtime[] }> = {};
  
  showtimes.forEach((showtime) => {
    const theater = showtime.theaters;
    if (!theater) return;
    
    if (!grouped[theater.id]) {
      grouped[theater.id] = {
        theater,
        showtimes: [],
      };
    }
    grouped[theater.id].showtimes.push(showtime);
  });
  
  // Sort showtimes within each theater by time
  Object.values(grouped).forEach((group) => {
    group.showtimes.sort((a, b) => 
      a.show_time.localeCompare(b.show_time)
    );
  });
  
  return Object.values(grouped);
};
