/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DeliveryMapProps {
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  className?: string;
  showCoverage?: boolean;
}

interface DeliveryZone {
  name: string;
  color: string;
  opacity: number;
  coordinates: google.maps.LatLngLiteral[];
}

// Minneapolis-St. Paul center coordinates
const DEFAULT_CENTER: google.maps.LatLngLiteral = { lat: 44.9537, lng: -93.09 };

// Delivery zones with coordinates for polygon drawing
const DELIVERY_ZONES: DeliveryZone[] = [
  {
    name: 'Minneapolis Metro',
    color: '#22c55e',
    opacity: 0.3,
    coordinates: [
      { lat: 45.0076, lng: -93.269 }, // North
      { lat: 44.9778, lng: -93.165 }, // East
      { lat: 44.8928, lng: -93.209 }, // South
      { lat: 44.9228, lng: -93.349 }, // West
    ],
  },
  {
    name: 'St. Paul Area',
    color: '#10b981',
    opacity: 0.25,
    coordinates: [
      { lat: 45.0076, lng: -93.109 }, // North
      { lat: 44.9778, lng: -92.965 }, // East
      { lat: 44.8928, lng: -93.009 }, // South
      { lat: 44.9228, lng: -93.189 }, // West
    ],
  },
  {
    name: 'Extended Coverage',
    color: '#059669',
    opacity: 0.2,
    coordinates: [
      { lat: 45.1276, lng: -93.389 }, // North
      { lat: 45.0576, lng: -92.865 }, // East
      { lat: 44.7728, lng: -93.009 }, // South
      { lat: 44.8428, lng: -93.489 }, // West
    ],
  },
];

// Google Maps styles for consistent appearance
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ color: '#f3f4f6' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#e0e7ff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e5e7eb' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
];

/**
 * DeliveryMap component following industry best practices
 * - Proper TypeScript typing with Google Maps types
 * - Error handling and loading states
 * - Memory leak prevention with cleanup
 * - Accessible fallback UI
 * - Performance optimized with useCallback
 */
export function DeliveryMap({
  center = DEFAULT_CENTER,
  zoom = 11,
  className,
  showCoverage = true,
}: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polygonsRef = useRef<google.maps.Polygon[]>([]);
  const infoWindowsRef = useRef<google.maps.InfoWindow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Check if API key is available
  const apiKey = import.meta.env['VITE_GOOGLE_MAPS_API_KEY'] as string | undefined;
  const isApiKeyValid = apiKey && apiKey !== 'your_google_maps_api_key';

  // Create custom marker icon
  const createMarkerIcon = useCallback((): google.maps.Icon => {
    return {
      url:
        'data:image/svg+xml;charset=UTF-8,' +
        encodeURIComponent(`
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="#22c55e" stroke="#ffffff" stroke-width="2"/>
            <path d="M20 10 L25 15 L25 25 L20 30 L15 25 L15 15 Z" fill="#ffffff"/>
            <circle cx="20" cy="20" r="3" fill="#22c55e"/>
          </svg>
        `),
      scaledSize: new google.maps.Size(40, 40),
      anchor: new google.maps.Point(20, 20),
    };
  }, []);

  // Initialize map
  const initializeMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      // Create map instance
      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        styles: MAP_STYLES,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_CENTER,
        },
      });

      mapInstanceRef.current = map;

      // Add center marker (DankDeals HQ)
      const marker = new google.maps.Marker({
        position: center,
        map,
        title: 'DankDeals Cannabis Delivery',
        icon: createMarkerIcon(),
      });
      markersRef.current.push(marker);

      // Add delivery zones if enabled
      if (showCoverage) {
        DELIVERY_ZONES.forEach((zone) => {
          // Create polygon
          const polygon = new google.maps.Polygon({
            paths: zone.coordinates,
            strokeColor: zone.color,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: zone.color,
            fillOpacity: zone.opacity,
            map,
          });
          polygonsRef.current.push(polygon);

          // Create info window
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; font-family: system-ui, sans-serif;">
                <h3 style="margin: 0 0 4px 0; font-size: 16px; color: #111827;">${zone.name}</h3>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">Delivery available in this area</p>
              </div>
            `,
          });
          infoWindowsRef.current.push(infoWindow);

          // Add click listener
          polygon.addListener('click', (event: google.maps.PolyMouseEvent) => {
            if (event.latLng) {
              infoWindow.setPosition(event.latLng);
              infoWindow.open(map);
            }
          });
        });
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing map:', error);
      setHasError(true);
      setIsLoading(false);
    }
  }, [center, zoom, showCoverage, createMarkerIcon]);

  // Load Google Maps script
  const loadGoogleMaps = useCallback(() => {
    if (!isApiKeyValid) {
      setIsLoading(false);
      return;
    }

    // Check if already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;

    // Define global callback
    const windowWithCallback = window as typeof window & { initMap?: () => void };
    windowWithCallback.initMap = () => {
      initializeMap();
      delete windowWithCallback.initMap;
    };

    // Handle script errors
    script.onerror = () => {
      console.error('Failed to load Google Maps');
      setHasError(true);
      setIsLoading(false);
      delete windowWithCallback.initMap;
    };

    document.head.appendChild(script);
  }, [apiKey, isApiKeyValid, initializeMap]);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Remove markers
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // Remove polygons
    polygonsRef.current.forEach((polygon) => {
      polygon.setMap(null);
    });
    polygonsRef.current = [];

    // Close info windows
    infoWindowsRef.current.forEach((infoWindow) => {
      infoWindow.close();
    });
    infoWindowsRef.current = [];

    // Clear map instance
    mapInstanceRef.current = null;
  }, []);

  // Effect to load map
  useEffect(() => {
    loadGoogleMaps();

    return cleanup;
  }, [loadGoogleMaps, cleanup]);

  // Static fallback UI
  if (!isApiKeyValid || hasError) {
    return (
      <div className={cn('relative overflow-hidden rounded-lg bg-muted', className)}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center p-8">
            <MapPin className="h-16 w-16 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Delivery Coverage Area</h3>
            <p className="text-muted-foreground mb-4">
              We deliver throughout Minneapolis, St. Paul, and surrounding metro areas
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <Badge variant="secondary">Minneapolis</Badge>
              <Badge variant="secondary">St. Paul</Badge>
              <Badge variant="secondary">Bloomington</Badge>
              <Badge variant="secondary">Edina</Badge>
              <Badge variant="secondary">And more...</Badge>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden rounded-lg', className)}>
      <div ref={mapRef} className="w-full h-full" />

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
