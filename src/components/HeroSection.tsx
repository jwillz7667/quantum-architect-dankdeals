import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { OptimizedImage } from "@/components/OptimizedImage";
import blueDreamImg from "@/assets/blue-dream.jpg";

export function HeroSection() {
  return (
    <Link to="/product/blue-dream">
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary to-primary-light shadow-elevated cursor-pointer hover:shadow-glow transition-all duration-300">
        <div className="absolute inset-0 gradient-overlay" />
        <div className="relative aspect-[16/9] flex items-end p-6">
          <div className="absolute top-1/2 right-2 md:right-4 transform -translate-y-1/2 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32">
            <OptimizedImage
              src={blueDreamImg}
              alt="Blue Dream - Premium Sativa Cannabis Flower"
              className="w-full h-full object-cover rounded-lg shadow-lg"
              width="128"
              height="128"
              priority
              sizes="(max-width: 640px) 96px, 128px"
            />
          </div>
          <div className="text-white z-10">
            <Badge variant="secondary" className="bg-accent-mint text-accent-mint-foreground mb-2">
              Featured
            </Badge>
            <h2 className="text-2xl font-bold mb-1">Blue Dream</h2>
            <p className="text-white/90">From $25.50</p>
          </div>
        </div>
      </div>
    </Link>
  );
}