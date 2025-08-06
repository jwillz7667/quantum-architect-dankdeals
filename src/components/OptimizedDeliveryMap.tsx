import type { ErrorInfo, ReactNode } from 'react';
import { useEffect, useRef, useState, useCallback, Component } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptimizedDeliveryMapProps {
  className?: string;
  height?: string;
  showCoverage?: boolean;
  interactive?: boolean;
  markers?: Array<{
    position: { lat: number; lng: number };
    title: string;
    info?: string;
  }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// Error Boundary Component
class MapErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Map Error:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Optimized map styles with reduced features
const OPTIMIZED_MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    featureType: 'all',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }], // Hide POI icons
  },
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }], // Hide all POIs
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }], // Hide transit
  },
  {
    featureType: 'road',
    elementType: 'labels',
    stylers: [{ visibility: 'simplified' }], // Simplify road labels
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#e0e7ff' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#f3f4f6' }],
  },
];

// Delivery area coordinates
const DELIVERY_AREAS = [
  {
    name: 'Minneapolis',
    center: { lat: 44.9778, lng: -93.265 },
    radius: 8000, // meters
  },
  {
    name: 'St. Paul',
    center: { lat: 44.9537, lng: -93.09 },
    radius: 7000,
  },
  {
    name: 'Bloomington',
    center: { lat: 44.8408, lng: -93.2983 },
    radius: 5000,
  },
  {
    name: 'Edina',
    center: { lat: 44.8897, lng: -93.3499 },
    radius: 4000,
  },
];

export const OptimizedDeliveryMap = ({
  className = '',
  height = '400px',
  showCoverage = true,
  interactive = false,
  markers = [],
}: OptimizedDeliveryMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const staticMapRef = useRef<HTMLImageElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerClustererRef = useRef<unknown>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInteractive, setIsInteractive] = useState(interactive);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Generate static map URL
  const getStaticMapUrl = useCallback(() => {
    const apiKey = import.meta.env['VITE_GOOGLE_MAPS_API_KEY'] as string | undefined;
    if (!apiKey || apiKey === 'DISABLED_FOR_SECURITY') return null;

    const center = '44.9537,-93.09'; // Minneapolis-St. Paul
    const zoom = 10;
    const size = '640x400';
    const scale = 2; // For retina displays

    let url = `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=${zoom}&size=${size}&scale=${scale}&key=${apiKey}`;

    // Add delivery area circles
    if (showCoverage) {
      DELIVERY_AREAS.forEach((area) => {
        const path = `color:0x4caf5066|fillcolor:0x4caf5033|weight:2|${area.center.lat},${area.center.lng}`;
        url += `&path=${encodeURIComponent(path)}`;
      });
    }

    // Add markers
    markers.slice(0, 10).forEach((marker) => {
      // Limit to 10 markers for static map
      url += `&markers=color:green|${marker.position.lat},${marker.position.lng}`;
    });

    return url;
  }, [showCoverage, markers]);

  // Initialize interactive map with clustering
  const initializeInteractiveMap = useCallback(async () => {
    if (!mapRef.current || mapInstanceRef.current || !window.google?.maps) return;

    try {
      setIsLoading(true);

      // Create map with optimized settings
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 44.9537, lng: -93.09 },
        zoom: 10,
        styles: OPTIMIZED_MAP_STYLES,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'cooperative', // Better mobile performance
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false, // Disable POI clicks
        // renderingType is not needed, will use default
      });

      mapInstanceRef.current = map;

      // Add delivery area circles
      if (showCoverage) {
        DELIVERY_AREAS.forEach((area) => {
          new google.maps.Circle({
            center: area.center,
            radius: area.radius,
            map,
            strokeColor: '#4caf50',
            strokeOpacity: 0.6,
            strokeWeight: 2,
            fillColor: '#4caf50',
            fillOpacity: 0.15,
          });
        });
      }

      // Add markers with clustering if many markers
      if (markers.length > 0) {
        const advancedMarkers = markers.map((markerData) => {
          const marker = new google.maps.marker.AdvancedMarkerElement({
            position: markerData.position,
            map,
            title: markerData.title,
          });

          if (markerData.info) {
            const infoWindow = new google.maps.InfoWindow({
              content: markerData.info,
            });

            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });
          }

          return marker;
        });

        markersRef.current = advancedMarkers;

        // Load marker clusterer for many markers
        if (markers.length > 10) {
          const { MarkerClusterer } = await import('@googlemaps/markerclusterer');
          markerClustererRef.current = new MarkerClusterer({
            map,
            markers: advancedMarkers,
            algorithmOptions: {
              maxZoom: 15,
            },
          });
        }
      }

      setMapLoaded(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing map:', error);
      setHasError(true);
      setIsLoading(false);
    }
  }, [showCoverage, markers]);

  // Load Google Maps script with lazy loading strategy
  const loadGoogleMaps = useCallback(() => {
    const apiKey = import.meta.env['VITE_GOOGLE_MAPS_API_KEY'] as string | undefined;

    if (!apiKey || apiKey === 'DISABLED_FOR_SECURITY') {
      setHasError(true);
      return;
    }

    if (window.google?.maps) {
      void initializeInteractiveMap();
      return;
    }

    // Create script with loading=lazy strategy
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&loading=lazy&callback=initOptimizedMap`;
    script.async = true;
    script.defer = true;
    // Native lazy loading for script tags
    script.setAttribute('loading', 'lazy');

    // Define global callback
    const windowWithCallback = window as typeof window & { initOptimizedMap?: () => void };
    windowWithCallback.initOptimizedMap = () => {
      void initializeInteractiveMap();
      delete windowWithCallback.initOptimizedMap;
    };

    script.onerror = () => {
      console.error('Failed to load Google Maps');
      setHasError(true);
      delete windowWithCallback.initOptimizedMap;
    };

    document.head.appendChild(script);
  }, [initializeInteractiveMap]);

  // Handle interaction to upgrade from static to interactive
  const handleInteraction = useCallback(() => {
    if (!isInteractive && !mapLoaded) {
      setIsInteractive(true);
      loadGoogleMaps();
    }
  }, [isInteractive, mapLoaded, loadGoogleMaps]);

  // Use IntersectionObserver for viewport detection
  useEffect(() => {
    if (!isInteractive || mapLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0] && entries[0].isIntersecting) {
          loadGoogleMaps();
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px', // Preload when close to viewport
      }
    );

    if (mapRef.current) {
      observer.observe(mapRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [isInteractive, mapLoaded, loadGoogleMaps]);

  // Cleanup
  useEffect(() => {
    return () => {
      // Clean up markers
      markersRef.current.forEach((marker) => {
        marker.map = null;
      });
      markersRef.current = [];

      // Clean up clusterer
      if (markerClustererRef.current) {
        const clusterer = markerClustererRef.current as { clearMarkers?: () => void };
        clusterer.clearMarkers?.();
        markerClustererRef.current = null;
      }

      // Clean up map
      mapInstanceRef.current = null;
    };
  }, []);

  const staticMapUrl = getStaticMapUrl();

  // Error fallback UI
  const errorFallback = (
    <div
      className={cn('relative flex items-center justify-center bg-muted rounded-lg', className)}
      style={{ height }}
    >
      <div className="text-center p-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Map unavailable</p>
      </div>
    </div>
  );

  return (
    <MapErrorBoundary fallback={errorFallback}>
      <div className={cn('relative overflow-hidden rounded-lg', className)} style={{ height }}>
        {/* Static map (initial load) */}
        {!isInteractive && staticMapUrl && (
          <div
            className="relative w-full h-full cursor-pointer group"
            onClick={handleInteraction}
            onKeyDown={(e) => e.key === 'Enter' && handleInteraction()}
            role="button"
            tabIndex={0}
            aria-label="Click to interact with map"
          >
            <img
              ref={staticMapRef}
              src={staticMapUrl}
              alt="Delivery area map"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <MapPin className="h-5 w-5 inline mr-2" />
                <span className="text-sm font-medium">Click to interact</span>
              </div>
            </div>
          </div>
        )}

        {/* Interactive map container */}
        {isInteractive && (
          <>
            <div
              ref={mapRef}
              className={cn('w-full h-full', !mapLoaded && 'hidden')}
              aria-label="Interactive delivery map"
            />

            {/* Loading state */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading interactive map...</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Error state */}
        {hasError && errorFallback}
      </div>
    </MapErrorBoundary>
  );
};
