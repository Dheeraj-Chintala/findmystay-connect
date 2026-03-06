import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PropertyCard from "./PropertyCard";
import { listings } from "@/data/mockListings";

const FeaturedListings = () => {
  const featured = listings.filter((l) => l.verified).slice(0, 6);

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-2">
              Featured Properties
            </h2>
            <p className="text-muted-foreground">Handpicked verified stays for you</p>
          </div>
          <Link to="/listings">
            <Button variant="ghost" className="gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((listing, i) => (
            <PropertyCard key={listing.id} listing={listing} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;
