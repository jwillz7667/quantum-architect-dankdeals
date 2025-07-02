import { ProductCard } from "./ProductCard";
import blueDreamImg from "@/assets/blue-dream.jpg";
import prerollsImg from "@/assets/prerolls.jpg";
import wellnessImg from "@/assets/wellness.jpg";
import ediblesImg from "@/assets/edibles-hero.jpg";

const hotProducts = [
  {
    id: "1",
    name: "Blue Dream",
    price: 25.50,
    type: "Hybrid",
    image: blueDreamImg,
  },
  {
    id: "2",
    name: "Pacific",
    price: 65.40,
    type: "Hybrid",
    image: prerollsImg,
  },
  {
    id: "3",
    name: "Green Relief",
    price: 35.00,
    type: "CBD",
    image: wellnessImg,
  },
  {
    id: "4",
    name: "Berry Gummies",
    price: 28.99,
    type: "Edible",
    image: ediblesImg,
  },
];

export function ProductGrid() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">Hot right now</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {hotProducts.map((product) => (
          <ProductCard
            key={product.id}
            {...product}
          />
        ))}
      </div>
    </div>
  );
}