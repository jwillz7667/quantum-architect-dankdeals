import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin } from 'lucide-react';

interface DeliveryAreaMapProps {
  className?: string;
  height?: string;
}

declare global {
  interface Window {
    google?: typeof google;
    initDeliveryAreaMap?: () => void;
  }
}

export const DeliveryAreaMap = ({ className = '', height = '200px' }: DeliveryAreaMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const initializeMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      // Initialize map centered on Minneapolis
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 44.9778, lng: -93.265 },
        zoom: 10,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'all',
            stylers: [{ saturation: -80 }],
          },
          {
            featureType: 'road.arterial',
            elementType: 'geometry',
            stylers: [{ hue: '#00ffee' }, { saturation: 50 }],
          },
          {
            featureType: 'poi.business',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });

      mapInstanceRef.current = map;

      // Define delivery area polygon coordinates
      const deliveryAreaCoords = [
        { lat: 45.0522, lng: -93.3437 }, // North Minneapolis
        { lat: 45.0511, lng: -93.1888 }, // North St. Paul
        { lat: 44.9778, lng: -93.165 }, // St. Paul
        { lat: 44.918, lng: -93.17 }, // South St. Paul
        { lat: 44.8848, lng: -93.228 }, // Mendota Heights
        { lat: 44.8672, lng: -93.2982 }, // Bloomington
        { lat: 44.8967, lng: -93.3502 }, // Richfield
        { lat: 44.9536, lng: -93.4058 }, // St. Louis Park
        { lat: 45.0084, lng: -93.3848 }, // Golden Valley
        { lat: 45.0522, lng: -93.3437 }, // Close the polygon
      ];

      // Create delivery area polygon
      const deliveryArea = new google.maps.Polygon({
        paths: deliveryAreaCoords,
        strokeColor: '#4caf50',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#4caf50',
        fillOpacity: 0.2,
      });

      deliveryArea.setMap(map);

      // Add markers for key cities
      const cities = [
        { name: 'Minneapolis', position: { lat: 44.9778, lng: -93.265 } },
        { name: 'St. Paul', position: { lat: 44.9537, lng: -93.09 } },
        { name: 'Bloomington', position: { lat: 44.8408, lng: -93.2983 } },
        { name: 'Edina', position: { lat: 44.8897, lng: -93.3499 } },
      ];

      cities.forEach((city) => {
        new google.maps.marker.AdvancedMarkerElement({
          position: city.position,
          map: map,
          title: city.name,
        });
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing map:', error);
      setHasError(true);
      setIsLoading(false);
    }
  }, []);

  const loadGoogleMaps = useCallback(() => {
    const apiKey = import.meta.env['VITE_GOOGLE_MAPS_API_KEY'] as string | undefined;

    if (!apiKey) {
      console.info('Google Maps API key not configured');
      setIsLoading(false);
      return;
    }

    // Check if already loaded
    if (window.google?.maps) {
      initializeMap();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&callback=initDeliveryAreaMap`;
    script.async = true;
    script.defer = true;

    // Define global callback
    window.initDeliveryAreaMap = () => {
      initializeMap();
      delete window.initDeliveryAreaMap;
    };

    // Handle script errors
    script.onerror = () => {
      console.error('Failed to load Google Maps');
      setHasError(true);
      setIsLoading(false);
      delete window.initDeliveryAreaMap;
    };

    document.head.appendChild(script);
  }, [initializeMap]);

  useEffect(() => {
    // Delay loading Google Maps until component is in viewport
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadGoogleMaps();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (mapRef.current) {
      observer.observe(mapRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [loadGoogleMaps]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };
  }, []);

  if (hasError || !apiKey) {
    return (
      <div
        className={`w-full rounded-lg bg-muted flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center p-6">
          <MapPin className="h-12 w-12 text-primary mx-auto mb-3" />
          <h3 className="text-base font-semibold mb-2">Delivery Coverage Area</h3>
          <p className="text-sm text-muted-foreground mb-3">
            We deliver throughout Minneapolis, St. Paul, and surrounding metro areas
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <span className="bg-background px-2 py-1 rounded">Minneapolis</span>
            <span className="bg-background px-2 py-1 rounded">St. Paul</span>
            <span className="bg-background px-2 py-1 rounded">Bloomington</span>
            <span className="bg-background px-2 py-1 rounded">Edina</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div
          className={`absolute inset-0 w-full rounded-lg bg-muted animate-pulse flex items-center justify-center ${className}`}
          style={{ height }}
        >
          <MapPin className="h-8 w-8 text-muted-foreground animate-bounce" />
        </div>
      )}
      <div
        ref={mapRef}
        className={`w-full rounded-lg ${className}`}
        style={{ height, display: isLoading ? 'none' : 'block' }}
      />
    </div>
  );
};
