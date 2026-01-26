import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { useCreateBooking, useMockPayment } from "@/hooks/useBookings";
import { useShowtimesByMovie, groupShowtimesByTheater, type Showtime } from "@/hooks/useTheaters";
import { useBookedSeats } from "@/hooks/useSeats";
import type { Movie } from "@/hooks/useMovies";
import { Calendar, Clock, Loader2, CreditCard, CheckCircle, Armchair, MapPin, ChevronLeft, Minus, Plus, Smartphone, Receipt, Download, Film } from "lucide-react";
import { format, addDays } from "date-fns";

interface BookingModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

type BookingStep = "tickets" | "theaters" | "seats" | "payment" | "success";
type PaymentMethod = "credit" | "debit" | "upi";

const SEAT_ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const SEATS_PER_ROW = 12;

const formatShowTime = (time: string) => {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const generateBookingNumber = () => {
  return `BK${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
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
  const [bookingNumber, setBookingNumber] = useState<string>("");
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [upiId, setUpiId] = useState("");

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
    setBookingNumber("");
    setPaymentMethod("credit");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setCardName("");
    setUpiId("");
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

  const handleBackToSeats = () => {
    setStep("seats");
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const isPaymentFormValid = () => {
    if (paymentMethod === "upi") {
      return upiId.includes("@") && upiId.length >= 5;
    }
    return (
      cardNumber.replace(/\s/g, "").length === 16 &&
      cardExpiry.length === 5 &&
      cardCvv.length >= 3 &&
      cardName.length >= 2
    );
  };

  const handlePayment = async () => {
    if (!bookingId || !isPaymentFormValid()) return;
    
    const newBookingNumber = generateBookingNumber();
    setBookingNumber(newBookingNumber);
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
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToSeats}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to seat selection
            </Button>

            {/* Booking Summary */}
            <div className="bg-secondary rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                  <Film className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">{movie.title}</h3>
                  <p className="text-sm text-muted-foreground">{movie.language} • {movie.duration}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Theater</span>
                  <p className="font-medium">{selectedShowtime.theaters?.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Location</span>
                  <p className="font-medium">{selectedShowtime.theaters?.location}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date</span>
                  <p className="font-medium">{format(selectedDate, "EEE, dd MMM yyyy")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Time</span>
                  <p className="font-medium">{formatShowTime(selectedShowtime.show_time)}</p>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm pt-2">
                <span className="text-muted-foreground">Seats</span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {selectedSeats.map((seat) => (
                    <Badge key={seat} variant="secondary">{seat}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex justify-between font-semibold border-t border-border pt-3 mt-2 text-lg">
                <span>Total Amount</span>
                <span className="text-primary">₹{totalAmount}</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Select Payment Method</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
                className="space-y-2"
              >
                <div className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${paymentMethod === "credit" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <RadioGroupItem value="credit" id="credit" />
                  <Label htmlFor="credit" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="w-5 h-5 text-blue-500" />
                    <span>Credit Card</span>
                  </Label>
                </div>
                <div className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${paymentMethod === "debit" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <RadioGroupItem value="debit" id="debit" />
                  <Label htmlFor="debit" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="w-5 h-5 text-green-500" />
                    <span>Debit Card</span>
                  </Label>
                </div>
                <div className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${paymentMethod === "upi" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <RadioGroupItem value="upi" id="upi" />
                  <Label htmlFor="upi" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Smartphone className="w-5 h-5 text-purple-500" />
                    <span>UPI</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Payment Form */}
            <div className="space-y-4">
              {(paymentMethod === "credit" || paymentMethod === "debit") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cardName">Cardholder Name</Label>
                    <Input
                      id="cardName"
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        maxLength={4}
                      />
                    </div>
                  </div>
                </>
              )}

              {paymentMethod === "upi" && (
                <div className="space-y-2">
                  <Label htmlFor="upiId">UPI ID</Label>
                  <Input
                    id="upiId"
                    placeholder="yourname@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Enter your UPI ID (e.g., name@paytm, name@gpay)</p>
                </div>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground text-center">
              🔒 This is a mock payment for demonstration. No actual charges will be made.
            </div>

            <Button
              className="w-full"
              onClick={handlePayment}
              disabled={mockPayment.isPending || !isPaymentFormValid()}
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

        {/* Step 5: Success / Booking Receipt */}
        {step === "success" && selectedShowtime && (
          <div className="space-y-6 mt-4">
            {/* Success Header */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-green-500 mb-1">Payment Successful!</h3>
              <p className="text-muted-foreground text-sm">Your booking has been confirmed</p>
            </div>

            {/* Booking Receipt */}
            <div className="bg-secondary rounded-lg overflow-hidden">
              {/* Receipt Header */}
              <div className="bg-primary/10 p-4 text-center border-b border-border">
                <Receipt className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground">BOOKING CONFIRMATION</p>
                <p className="font-mono font-bold text-lg text-primary">{bookingNumber}</p>
              </div>

              {/* Movie Info */}
              <div className="p-4 border-b border-border">
                <h4 className="font-semibold text-lg">{movie.title}</h4>
                <p className="text-sm text-muted-foreground">{movie.language} • {movie.duration}</p>
                {movie.genre && (
                  <div className="flex gap-1 mt-2">
                    {movie.genre.slice(0, 2).map((g) => (
                      <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Booking Details */}
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Theater
                  </span>
                  <span className="font-medium text-right">
                    {selectedShowtime.theaters?.name}<br />
                    <span className="text-xs text-muted-foreground">{selectedShowtime.theaters?.location}</span>
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Date
                  </span>
                  <span className="font-medium">{format(selectedDate, "EEEE, dd MMMM yyyy")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Show Time
                  </span>
                  <span className="font-medium">{formatShowTime(selectedShowtime.show_time)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Armchair className="w-4 h-4" /> Seats
                  </span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {selectedSeats.map((seat) => (
                      <Badge key={seat} className="bg-primary text-primary-foreground">{seat}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tickets</span>
                  <span className="font-medium">{ticketCount} × ₹{ticketPrice}</span>
                </div>
              </div>

              {/* Total */}
              <div className="bg-primary/5 p-4 flex justify-between items-center">
                <span className="font-semibold">Amount Paid</span>
                <span className="text-xl font-bold text-primary">₹{totalAmount}</span>
              </div>
            </div>

            {/* Payment Method Used */}
            <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Paid via</span>
              <span className="font-medium flex items-center gap-2">
                {paymentMethod === "upi" ? (
                  <><Smartphone className="w-4 h-4 text-purple-500" /> UPI</>
                ) : paymentMethod === "credit" ? (
                  <><CreditCard className="w-4 h-4 text-blue-500" /> Credit Card</>
                ) : (
                  <><CreditCard className="w-4 h-4 text-green-500" /> Debit Card</>
                )}
              </span>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              📧 A confirmation email has been sent to {user?.email}
            </p>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/my-bookings")}>
                <Receipt className="mr-2 h-4 w-4" />
                View Bookings
              </Button>
              <Button className="flex-1" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
