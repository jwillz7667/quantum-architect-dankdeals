import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import blueDreamImg from "@/assets/blue-dream.jpg";

export function HeroSection() {
  return (
    <Link to="/product/blue-dream">
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary to-primary-light shadow-elevated cursor-pointer hover:shadow-glow transition-all duration-300">
        <div className="absolute inset-0 gradient-overlay" />
        <div className="relative aspect-[16/9] flex items-end p-6">
          <div className="absolute top-1/2 right-4 transform -translate-y-1/2 w-32 h-32">
            <img
              src={blueDreamImg}
              alt="Blue Dream Cannabis"
              className="w-full h-full object-cover rounded-lg shadow-lg"
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