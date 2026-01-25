import movie1 from "@/assets/movies/movie1.jpg";
import movie2 from "@/assets/movies/movie2.jpg";
import movie3 from "@/assets/movies/movie3.jpg";
import movie4 from "@/assets/movies/movie4.jpg";
import movie5 from "@/assets/movies/movie5.jpg";
import movie6 from "@/assets/movies/movie6.jpg";

export interface Movie {
  id: number;
  title: string;
  poster: string;
  genre: string[];
  rating: number;
  language: string;
  releaseDate: string;
  duration: string;
  isFeatured?: boolean;
}

export const movies: Movie[] = [
  {
    id: 1,
    title: "Shadow Strike",
    poster: movie1,
    genre: ["Action", "Thriller"],
    rating: 8.5,
    language: "English",
    releaseDate: "2025-01-15",
    duration: "2h 15m",
    isFeatured: true,
  },
  {
    id: 2,
    title: "Paris Hearts",
    poster: movie2,
    genre: ["Romance", "Comedy"],
    rating: 7.8,
    language: "English",
    releaseDate: "2025-01-20",
    duration: "1h 55m",
    isFeatured: true,
  },
  {
    id: 3,
    title: "The Haunting",
    poster: movie3,
    genre: ["Horror", "Mystery"],
    rating: 7.2,
    language: "English",
    releaseDate: "2025-01-10",
    duration: "2h 05m",
    isFeatured: true,
  },
  {
    id: 4,
    title: "Magic Kingdom",
    poster: movie4,
    genre: ["Animation", "Family"],
    rating: 8.9,
    language: "English",
    releaseDate: "2025-01-25",
    duration: "1h 45m",
  },
  {
    id: 5,
    title: "Galactic Voyage",
    poster: movie5,
    genre: ["Sci-Fi", "Adventure"],
    rating: 8.1,
    language: "English",
    releaseDate: "2025-02-01",
    duration: "2h 30m",
  },
  {
    id: 6,
    title: "The Champion",
    poster: movie6,
    genre: ["Drama", "Sports"],
    rating: 8.7,
    language: "English",
    releaseDate: "2025-01-28",
    duration: "2h 10m",
  },
];

export const genres = [
  "All",
  "Action",
  "Comedy",
  "Drama",
  "Horror",
  "Romance",
  "Sci-Fi",
  "Animation",
  "Thriller",
  "Adventure",
  "Family",
  "Sports",
  "Mystery",
];
