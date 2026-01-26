import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCreateBooking, useMockPayment } from "@/hooks/useBookings";
import { useShowtimesByMovie, groupShowtimesByTheater, type Showtime } from "@/hooks/useTheaters";
import { useBookedSeats } from "@/hooks/useSeats";
import type { Movie } from "@/hooks/useMovies";
import { Calendar, Clock, Loader2, CreditCard, CheckCircle, Armchair, MapPin, ChevronLeft, Minus, Plus } from "lucide-react";
import { format, addDays } from "date-fns";

interface BookingModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

type BookingStep = "tickets" | "theaters" | "seats" | "payment" | "success";

const SEAT_ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const SEATS_PER_ROW = 12;

const formatShowTime = (time: string) => {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const BookingModal = ({ movie, isOpen, onClose }: BookingModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createBooking = useCreateBooking();
  const mockPayment = useMockPayment();
  
  const [step, setStep] = useState<BookingStep>("tickets");
  const [ticketCount, setTicketCount] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const { data: showtimes, isLoading: showtimesLoading } = useShowtimesByMovie(
    movie?.id || "",
    selectedDate
  );

  const { data: bookedSeats = [], isLoading: seatsLoading } = useBookedSeats(
    selectedShowtime?.id
  );

  const groupedShowtimes = useMemo(() => {
    if (!showtimes) return [];
    return groupShowtimesByTheater(showtimes as Showtime[]);
  }, [showtimes]);

  const ticketPrice = selectedShowtime?.price || 250;
  const totalAmount = ticketPrice * ticketCount;

  const handleReset = () => {
    setStep("tickets");
    setTicketCount(1);
    setSelectedDate(new Date());
    setSelectedShowtime(null);
    setSelectedSeats([]);
    setBookingId(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleTicketCountChange = (delta: number) => {
    const newCount = ticketCount + delta;
    if (newCount >= 1 && newCount <= 10) {
      setTicketCount(newCount);
      // Reset selected seats if count changes
      setSelectedSeats([]);
    }
  };

  const handleProceedToTheaters = () => {
    setStep("theaters");
  };

  const handleSelectShowtime = (showtime: Showtime) => {
    setSelectedShowtime(showtime);
    setSelectedSeats([]);
    setStep("seats");
  };

  const handleBackToTickets = () => {
    setStep("tickets");
  };

  const handleBackToTheaters = () => {
    setSelectedShowtime(null);
    setSelectedSeats([]);
    setStep("theaters");
  };

  const handleSeatClick = (seatId: string) => {
    // Check if seat is booked
    if (bookedSeats.includes(seatId)) return;

    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        // Deselect seat
        return prev.filter((s) => s !== seatId);
      } else if (prev.length < ticketCount) {
        // Select seat if under limit
        return [...prev, seatId];
      } else {
        // Replace oldest selection if at limit
        return [...prev.slice(1), seatId];
      }
    });
  };

  const handleBooking = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!movie || !selectedShowtime || selectedSeats.length !== ticketCount) return;

    try {
      const [hours, minutes] = selectedShowtime.show_time.split(":").map(Number);
      const bookingTime = new Date(selectedDate);
      bookingTime.setHours(hours, minutes);

      const booking = await createBooking.mutateAsync({
        movie_id: movie.id,
        theater_id: selectedShowtime.theater_id,
        showtime_id: selectedShowtime.id,
        booking_time: bookingTime.toISOString(),
        seat_number: selectedSeats.join(", "),
        status: "pending",
        amount: totalAmount,
      });

      setBookingId(booking.id);
      setStep("payment");
    } catch (error) {
      console.error("Booking failed:", error);
    }
  };

  const handlePayment = async () => {
    if (!bookingId) return;
    
    await mockPayment.mutateAsync(bookingId);
    setStep("success");
  };

  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  if (!movie) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {step === "tickets" && "How Many Tickets?"}
            {step === "theaters" && "Select Theater & Showtime"}
            {step === "seats" && "Select Your Seats"}
            {step === "payment" && "Complete Payment"}
            {step === "success" && "Booking Confirmed!"}
          </DialogTitle>
          <DialogDescription>
            {movie.title}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Ticket Count */}
        {step === "tickets" && (
          <div className="space-y-6 mt-4">
            <div className="flex flex-col items-center justify-center py-8">
              <Label className="text-lg mb-6">Select Number of Tickets</Label>
              <div className="flex items-center gap-6">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleTicketCountChange(-1)}
                  disabled={ticketCount <= 1}
                  className="h-12 w-12 rounded-full"
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <div className="text-center">
                  <span className="text-5xl font-bold text-primary">{ticketCount}</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {ticketCount === 1 ? "Ticket" : "Tickets"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleTicketCountChange(1)}
                  disabled={ticketCount >= 10}
                  className="h-12 w-12 rounded-full"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Maximum 10 tickets per booking
              </p>
            </div>

            <Button className="w-full" onClick={handleProceedToTheaters}>
              Continue to Select Theater
            </Button>
          </div>
        )}

        {/* Step 2: Theater & Showtime Selection */}
        {step === "theaters" && (
          <div className="space-y-6 mt-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToTickets}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to ticket selection
            </Button>

            {/* Ticket Count Badge */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {ticketCount} {ticketCount === 1 ? "Ticket" : "Tickets"}
              </Badge>
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Select Date
              </Label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dates.map((date) => (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`flex flex-col items-center px-4 py-2 rounded-lg border transition-colors min-w-[70px] ${
                      format(selectedDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary border-border hover:border-primary"
                    }`}
                  >
                    <span className="text-xs">{format(date, "EEE")}</span>
                    <span className="text-lg font-bold">{format(date, "d")}</span>
                    <span className="text-xs">{format(date, "MMM")}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Theaters and Showtimes */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Theaters Showing {movie.title}
              </h2>

              {showtimesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading showtimes...</span>
                </div>
              ) : groupedShowtimes.length === 0 ? (
                <div className="text-center py-8 bg-secondary rounded-lg">
                  <p className="text-muted-foreground">No showtimes available for this date.</p>
                  <p className="text-sm text-muted-foreground mt-1">Try selecting a different date.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedShowtimes.map(({ theater, showtimes }) => (
                    <div key={theater.id} className="bg-secondary rounded-lg p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{theater.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {theater.location}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {showtimes.map((showtime) => (
                          <Button
                            key={showtime.id}
                            variant="outline"
                            size="sm"
                            className="flex flex-col h-auto py-2 px-4 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                            onClick={() => handleSelectShowtime(showtime)}
                          >
                            <span className="font-semibold">{formatShowTime(showtime.show_time)}</span>
                            <span className="text-xs text-muted-foreground">₹{showtime.price}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Seat Selection */}
        {step === "seats" && selectedShowtime && (
          <div className="space-y-6 mt-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToTheaters}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to theaters
            </Button>

            {/* Selected Showtime Info */}
            <div className="bg-secondary rounded-lg p-4 space-y-1">
              <p className="font-semibold">{selectedShowtime.theaters?.name}</p>
              <p className="text-sm text-muted-foreground">{selectedShowtime.theaters?.location}</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-primary" />
                  {format(selectedDate, "EEE, dd MMM")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-primary" />
                  {formatShowTime(selectedShowtime.show_time)}
                </span>
                <Badge variant="secondary">
                  {ticketCount} {ticketCount === 1 ? "Ticket" : "Tickets"}
                </Badge>
              </div>
            </div>

            {/* Seat Legend */}
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border-2 border-green-500 bg-transparent" />
                <span className="text-muted-foreground">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary" />
                <span className="text-muted-foreground">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-muted" />
                <span className="text-muted-foreground">Booked</span>
              </div>
            </div>

            {/* Seat Selection Grid */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 justify-center">
                <Armchair className="w-4 h-4" />
                Select {ticketCount} {ticketCount === 1 ? "Seat" : "Seats"}
                {selectedSeats.length > 0 && (
                  <span className="text-primary">({selectedSeats.length}/{ticketCount} selected)</span>
                )}
              </Label>
              
              {seatsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-2 overflow-x-auto">
                  {SEAT_ROWS.map((row) => (
                    <div key={row} className="flex items-center gap-2 justify-center">
                      <span className="w-6 text-muted-foreground font-medium">{row}</span>
                      <div className="flex gap-1">
                        {Array.from({ length: SEATS_PER_ROW }, (_, i) => {
                          const seatId = `${row}${i + 1}`;
                          const isBooked = bookedSeats.includes(seatId);
                          const isSelected = selectedSeats.includes(seatId);
                          
                          return (
                            <button
                              key={seatId}
                              onClick={() => handleSeatClick(seatId)}
                              disabled={isBooked}
                              className={`w-7 h-7 text-xs rounded transition-all flex items-center justify-center font-medium ${
                                isBooked
                                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                                  : isSelected
                                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                                  : "bg-transparent border-2 border-green-500 text-green-500 hover:bg-green-500/10"
                              }`}
                              title={isBooked ? "Seat booked" : `Seat ${seatId}`}
                            >
                              {i + 1}
                            </button>
                          );
                        })}
                      </div>
                      <span className="w-6 text-muted-foreground font-medium">{row}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Screen Indicator */}
              <div className="flex items-center justify-center mt-4">
                <div className="w-3/4 h-2 bg-gradient-to-t from-primary/50 to-primary/20 rounded-t-full" />
              </div>
              <div className="flex items-center gap-1 text-center justify-center py-2">
                <span className="text-xs text-muted-foreground uppercase tracking-widest">Screen</span>
              </div>
            </div>

            {/* Summary */}
            {selectedSeats.length > 0 && (
              <div className="bg-secondary rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Theater</span>
                  <span>{selectedShowtime.theaters?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span>{format(selectedDate, "EEE, dd MMM yyyy")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Time</span>
                  <span>{formatShowTime(selectedShowtime.show_time)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Seats</span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {selectedSeats.map((seat) => (
                      <Badge key={seat} variant="secondary">{seat}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-border pt-2 mt-2">
                  <span>Total ({ticketCount} × ₹{ticketPrice})</span>
                  <span className="text-primary">₹{totalAmount}</span>
                </div>
              </div>
            )}

            <Button
              className="w-full"
              disabled={selectedSeats.length !== ticketCount || createBooking.isPending}
              onClick={handleBooking}
            >
              {createBooking.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Booking...
                </>
              ) : user ? (
                selectedSeats.length !== ticketCount
                  ? `Select ${ticketCount - selectedSeats.length} more seat${ticketCount - selectedSeats.length > 1 ? 's' : ''}`
                  : "Proceed to Payment"
              ) : (
                "Sign In to Book"
              )}
            </Button>
          </div>
        )}

        {/* Step 4: Payment */}
        {step === "payment" && selectedShowtime && (
          <div className="space-y-6 mt-4">
            <div className="bg-secondary rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Movie</span>
                <span>{movie.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Theater</span>
                <span>{selectedShowtime.theaters?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span>{format(selectedDate, "EEE, dd MMM yyyy")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time</span>
                <span>{formatShowTime(selectedShowtime.show_time)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Seats</span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {selectedSeats.map((seat) => (
                    <Badge key={seat} variant="secondary">{seat}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex justify-between font-semibold border-t border-border pt-2 mt-2">
                <span>Total ({ticketCount} tickets)</span>
                <span className="text-primary">₹{totalAmount}</span>
              </div>
            </div>

            <div className="text-center text-muted-foreground text-sm">
              <CreditCard className="w-12 h-12 mx-auto mb-2 text-primary" />
              <p>This is a mock payment. Click Pay Now to simulate the payment process.</p>
            </div>

            <Button
              className="w-full"
              onClick={handlePayment}
              disabled={mockPayment.isPending}
            >
              {mockPayment.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay ₹{totalAmount}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 5: Success */}
        {step === "success" && selectedShowtime && (
          <div className="space-y-6 mt-4 text-center">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
              <p className="text-muted-foreground">
                Your booking for <span className="text-foreground font-medium">{movie.title}</span> is confirmed.
              </p>
            </div>

            <div className="bg-secondary rounded-lg p-4 space-y-2 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Theater</span>
                <span>{selectedShowtime.theaters?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span>{format(selectedDate, "EEE, dd MMM yyyy")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time</span>
                <span>{formatShowTime(selectedShowtime.show_time)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Seats</span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {selectedSeats.map((seat) => (
                    <Badge key={seat} variant="secondary">{seat}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="text-primary font-semibold">₹{totalAmount}</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              📧 A confirmation email has been sent to your registered email address.
            </p>

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
