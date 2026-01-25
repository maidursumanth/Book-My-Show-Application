import Navbar from "@/components/Navbar";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import MovieListings from "@/components/MovieListings";
import Footer from "@/components/Footer";
import { movies } from "@/data/movies";

const Index = () => {
  const featuredMovies = movies.filter((movie) => movie.isFeatured);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <FeaturedCarousel movies={featuredMovies} />
        <MovieListings />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
