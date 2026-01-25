import Navbar from "@/components/Navbar";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import MovieListings from "@/components/MovieListings";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <FeaturedCarousel />
        <MovieListings />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
