import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBookings } from "@/hooks/useBookings";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Calendar, Clock, Armchair, Ticket } from "lucide-react";

// Import local movie posters for display
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

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-500",
  confirmed: "bg-blue-500/20 text-blue-500",
  paid: "bg-green-500/20 text-green-500",
  cancelled: "bg-red-500/20 text-red-500",
};

const MyBookings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: bookings, isLoading } = useBookings();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Ticket className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">My Bookings</h1>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : bookings && bookings.length > 0 ? (
          <div className="grid gap-4">
            {bookings.map((booking: any) => (
              <Card key={booking.id} className="bg-card border-border overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* Movie Poster */}
                    <div className="w-full sm:w-32 h-40 sm:h-auto flex-shrink-0">
                      <img
                        src={posterMap[booking.movies?.poster_url] || booking.movies?.poster_url}
                        alt={booking.movies?.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Booking Details */}
                    <div className="flex-1 p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">
                            {booking.movies?.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(booking.booking_time), "EEE, dd MMM yyyy")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(new Date(booking.booking_time), "h:mm a")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Armchair className="w-4 h-4" />
                              Seat {booking.seat_number}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Badge className={statusColors[booking.status]}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </Badge>
                          <span className="font-semibold text-primary">
                            ₹{booking.amount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="py-16 text-center">
              <Ticket className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Bookings Yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't made any bookings yet. Start by browsing our movies!
              </p>
              <button
                onClick={() => navigate("/")}
                className="text-primary hover:underline"
              >
                Browse Movies →
              </button>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyBookings;
