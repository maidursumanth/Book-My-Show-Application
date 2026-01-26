import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useBookedSeats = (showtimeId: string | undefined) => {
  return useQuery({
    queryKey: ["booked-seats", showtimeId],
    queryFn: async () => {
      if (!showtimeId) return [];

      const { data, error } = await supabase
        .from("bookings")
        .select("seat_number")
        .eq("showtime_id", showtimeId)
        .in("status", ["pending", "confirmed", "paid"]);

      if (error) throw error;
      
      // Flatten seat numbers (each booking might have multiple seats)
      const bookedSeats: string[] = [];
      data?.forEach((booking) => {
        if (booking.seat_number) {
          // Handle comma-separated seats
          const seats = booking.seat_number.split(",").map(s => s.trim());
          bookedSeats.push(...seats);
        }
      });
      
      return bookedSeats;
    },
    enabled: !!showtimeId,
  });
};

export const generateSeatLayout = (rows: string[], seatsPerRow: number) => {
  const seats: { id: string; row: string; number: number }[] = [];
  
  rows.forEach((row) => {
    for (let i = 1; i <= seatsPerRow; i++) {
      seats.push({
        id: `${row}${i}`,
        row,
        number: i,
      });
    }
  });
  
  return seats;
};
