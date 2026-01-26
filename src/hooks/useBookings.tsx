import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export type Booking = Tables<"bookings">;

type BookingInsert = {
  movie_id: string;
  booking_time: string;
  seat_number?: string | null;
  status?: "pending" | "confirmed" | "paid" | "cancelled";
  amount?: number | null;
  theater_id?: string | null;
  showtime_id?: string | null;
};

export const useBookings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["bookings", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          movies (
            id,
            title,
            poster_url,
            duration,
            language
          ),
          theaters (
            id,
            name,
            location
          ),
          showtimes (
            id,
            show_time,
            price
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (booking: Omit<BookingInsert, "user_id">) => {
      if (!user) throw new Error("Must be logged in to book");

      const { data, error } = await supabase
        .from("bookings")
        .insert({
          ...booking,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
};

export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "pending" | "confirmed" | "paid" | "cancelled" }) => {
      const { data, error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
};

// Mock payment function
export const useMockPayment = () => {
  const updateStatus = useUpdateBookingStatus();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      // Simulate payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Update booking status to paid
      await updateStatus.mutateAsync({ id: bookingId, status: "paid" });
      
      return true;
    },
    onSuccess: () => {
      // Mock email notification - show toast
      toast({
        title: "Booking Confirmed! 🎉",
        description: "Your booking has been confirmed. A confirmation email has been sent to your registered email address.",
      });
    },
    onError: () => {
      toast({
        title: "Payment Failed",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      });
    },
  });
};
