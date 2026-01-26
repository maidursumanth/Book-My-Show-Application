-- Create theaters table
CREATE TABLE public.theaters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create showtimes table linking movies to theaters
CREATE TABLE public.showtimes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  theater_id UUID NOT NULL REFERENCES public.theaters(id) ON DELETE CASCADE,
  show_time TIME NOT NULL,
  show_date DATE NOT NULL,
  price NUMERIC NOT NULL DEFAULT 12.99,
  available_seats INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.theaters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showtimes ENABLE ROW LEVEL SECURITY;

-- Anyone can view theaters
CREATE POLICY "Anyone can view active theaters"
ON public.theaters FOR SELECT
USING (is_active = true);

-- Anyone can view showtimes
CREATE POLICY "Anyone can view active showtimes"
ON public.showtimes FOR SELECT
USING (is_active = true);

-- Add theater_id and showtime_id to bookings
ALTER TABLE public.bookings 
ADD COLUMN theater_id UUID REFERENCES public.theaters(id),
ADD COLUMN showtime_id UUID REFERENCES public.showtimes(id);

-- Create indexes for performance
CREATE INDEX idx_showtimes_movie_id ON public.showtimes(movie_id);
CREATE INDEX idx_showtimes_theater_id ON public.showtimes(theater_id);
CREATE INDEX idx_showtimes_show_date ON public.showtimes(show_date);

-- Add updated_at triggers
CREATE TRIGGER update_theaters_updated_at
BEFORE UPDATE ON public.theaters
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_showtimes_updated_at
BEFORE UPDATE ON public.showtimes
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();