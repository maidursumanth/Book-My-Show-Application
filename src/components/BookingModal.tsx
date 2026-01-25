import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCreateBooking, useMockPayment } from "@/hooks/useBookings";
import type { Movie } from "@/hooks/useMovies";
import { Calendar, Clock, Loader2, CreditCard, CheckCircle, Armchair } from "lucide-react";
import { format, addDays } from "date-fns";

interface BookingModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

type BookingStep = "details" | "payment" | "success";

const showTimes = ["10:00 AM", "1:30 PM", "4:00 PM", "7:00 PM", "10:30 PM"];
const seatRows = ["A", "B", "C", "D", "E"];

const BookingModal = ({ movie, isOpen, onClose }: BookingModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createBooking = useCreateBooking();
  const mockPayment = useMockPayment();
  
  const [step, setStep] = useState<BookingStep>("details");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedSeat, setSelectedSeat] = useState<string>("");
  const [bookingId, setBookingId] = useState<string | null>(null);

  const ticketPrice = 250; // Mock price

  const handleReset = () => {
    setStep("details");
    setSelectedDate(new Date());
    setSelectedTime("");
    setSelectedSeat("");
    setBookingId(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleBooking = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!movie || !selectedTime || !selectedSeat) return;

    try {
      const [hours, minutes] = selectedTime.replace(/ (AM|PM)/, "").split(":").map(Number);
      const isPM = selectedTime.includes("PM");
      const bookingTime = new Date(selectedDate);
      bookingTime.setHours(isPM && hours !== 12 ? hours + 12 : hours, minutes);

      const booking = await createBooking.mutateAsync({
        movie_id: movie.id,
        booking_time: bookingTime.toISOString(),
        seat_number: selectedSeat,
        status: "pending",
        amount: ticketPrice,
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
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {step === "details" && "Book Tickets"}
            {step === "payment" && "Complete Payment"}
            {step === "success" && "Booking Confirmed!"}
          </DialogTitle>
          <DialogDescription>
            {movie.title}
          </DialogDescription>
        </DialogHeader>

        {step === "details" && (
          <div className="space-y-6 mt-4">
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

            {/* Time Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Select Show Time
              </Label>
              <div className="flex flex-wrap gap-2">
                {showTimes.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>

            {/* Seat Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Armchair className="w-4 h-4" />
                Select Seat
              </Label>
              <div className="space-y-2">
                {seatRows.map((row) => (
                  <div key={row} className="flex items-center gap-2">
                    <span className="w-6 text-muted-foreground">{row}</span>
                    <div className="flex gap-1">
                      {Array.from({ length: 10 }, (_, i) => {
                        const seat = `${row}${i + 1}`;
                        return (
                          <button
                            key={seat}
                            onClick={() => setSelectedSeat(seat)}
                            className={`w-7 h-7 text-xs rounded transition-colors ${
                              selectedSeat === seat
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary hover:bg-muted"
                            }`}
                          >
                            {i + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 text-center justify-center bg-muted/50 py-2 rounded mt-2">
                <span className="text-xs text-muted-foreground">SCREEN THIS WAY</span>
              </div>
            </div>

            {/* Summary */}
            {selectedTime && selectedSeat && (
              <div className="bg-secondary rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span>{format(selectedDate, "EEE, dd MMM yyyy")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Time</span>
                  <span>{selectedTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Seat</span>
                  <Badge variant="secondary">{selectedSeat}</Badge>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-border pt-2 mt-2">
                  <span>Total Amount</span>
                  <span className="text-primary">₹{ticketPrice}</span>
                </div>
              </div>
            )}

            <Button
              className="w-full"
              disabled={!selectedTime || !selectedSeat || createBooking.isPending}
              onClick={handleBooking}
            >
              {createBooking.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Booking...
                </>
              ) : user ? (
                "Proceed to Payment"
              ) : (
                "Sign In to Book"
              )}
            </Button>
          </div>
        )}

        {step === "payment" && (
          <div className="space-y-6 mt-4">
            <div className="bg-secondary rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Movie</span>
                <span>{movie.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span>{format(selectedDate, "EEE, dd MMM yyyy")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time</span>
                <span>{selectedTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Seat</span>
                <Badge variant="secondary">{selectedSeat}</Badge>
              </div>
              <div className="flex justify-between font-semibold border-t border-border pt-2 mt-2">
                <span>Total</span>
                <span className="text-primary">₹{ticketPrice}</span>
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
                  Pay ₹{ticketPrice}
                </>
              )}
            </Button>
          </div>
        )}

        {step === "success" && (
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
                <span className="text-muted-foreground">Date</span>
                <span>{format(selectedDate, "EEE, dd MMM yyyy")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time</span>
                <span>{selectedTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Seat</span>
                <Badge variant="secondary">{selectedSeat}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="text-primary font-semibold">₹{ticketPrice}</span>
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
