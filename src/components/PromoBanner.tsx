/**
 * Promotional Banner Carousel
 *
 * Auto-rotating promotional banners using Swiper.js
 * Rotates every 5 seconds with smooth transitions
 */

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Truck, Gift, Sparkles } from 'lucide-react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

interface PromoBannerData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  icon: React.ReactNode;
  bgGradient: string;
  textColor: string;
}

const promoData: PromoBannerData[] = [
  {
    id: 'promo-1',
    title: 'Free Delivery',
    subtitle: 'On Orders Over $50',
    description: 'Get your favorite products delivered to your door at no extra cost',
    ctaText: 'Shop Now',
    ctaLink: '/categories',
    icon: <Truck className="h-8 w-8" />,
    bgGradient: 'linear-gradient(135deg, #6DD400 0%, #5BC000 100%)',
    textColor: 'text-primary-foreground',
  },
  {
    id: 'promo-2',
    title: 'New Products Weekly',
    subtitle: 'Fresh Arrivals Every Week',
    description: 'Discover the latest premium strains and products',
    ctaText: 'Browse Products',
    ctaLink: '/categories',
    icon: <Sparkles className="h-8 w-8" />,
    bgGradient: 'linear-gradient(135deg, #3A3A3C 0%, #2C2C2E 100%)',
    textColor: 'text-foreground',
  },
  {
    id: 'promo-3',
    title: 'First Order Special',
    subtitle: '10% Off Your First Purchase',
    description: 'Join DankDeals and save on your first order',
    ctaText: 'Get Started',
    ctaLink: '/categories',
    icon: <Gift className="h-8 w-8" />,
    bgGradient: 'linear-gradient(135deg, #6DD400 0%, #5BC000 100%)',
    textColor: 'text-primary-foreground',
  },
  {
    id: 'promo-4',
    title: 'Same-Day Delivery',
    subtitle: 'Order Before 8 PM',
    description: 'Get your products delivered the same day across Minneapolis metro',
    ctaText: 'Order Now',
    ctaLink: '/categories',
    icon: <ShoppingBag className="h-8 w-8" />,
    bgGradient: 'linear-gradient(135deg, #3A3A3C 0%, #2C2C2E 100%)',
    textColor: 'text-foreground',
  },
];

export function PromoBanner() {
  const navigate = useNavigate();

  return (
    <div className="w-full overflow-hidden rounded-xl shadow-elevated">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{
          clickable: true,
          bulletClass: 'swiper-pagination-bullet !bg-white/50',
          bulletActiveClass: 'swiper-pagination-bullet-active !bg-white',
        }}
        effect="fade"
        fadeEffect={{
          crossFade: true,
        }}
        loop={true}
        className="promo-swiper"
        style={{ height: '100%' }}
      >
        {promoData.map((promo) => (
          <SwiperSlide key={promo.id}>
            <div
              className={`relative px-6 py-8 md:px-12 md:py-10 ${promo.textColor}`}
              style={{ background: promo.bgGradient }}
            >
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="p-4 rounded-full bg-white/10 backdrop-blur-sm">
                      {promo.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-center md:text-left space-y-2">
                    <div className="text-sm font-semibold opacity-90">{promo.subtitle}</div>
                    <h2 className="text-3xl md:text-4xl font-bold">{promo.title}</h2>
                    <p className="text-sm md:text-base opacity-90 max-w-2xl">
                      {promo.description}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="flex-shrink-0">
                    <Button
                      size="lg"
                      variant={promo.bgGradient.includes('#6DD400') ? 'secondary' : 'default'}
                      onClick={() => navigate(promo.ctaLink)}
                      className="font-semibold shadow-lg hover:shadow-xl transition-shadow"
                    >
                      {promo.ctaText}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <style>{`
        .promo-swiper {
          --swiper-pagination-bottom: 12px;
          --swiper-pagination-bullet-size: 8px;
          --swiper-pagination-bullet-horizontal-gap: 4px;
        }

        .promo-swiper .swiper-pagination-bullet {
          transition: all 0.3s ease;
        }

        .promo-swiper .swiper-pagination-bullet:hover {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
}

