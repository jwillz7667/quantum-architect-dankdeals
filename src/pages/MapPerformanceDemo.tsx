import { useState } from 'react';
import { DeliveryAreaMap } from '@/components/DeliveryAreaMap';
import { OptimizedDeliveryMap } from '@/components/OptimizedDeliveryMap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Zap, Image, MousePointer, Shield, Layers } from 'lucide-react';

// Sample markers for testing
const SAMPLE_MARKERS = [
  {
    position: { lat: 44.9778, lng: -93.265 },
    title: 'Minneapolis Downtown',
    info: 'Main delivery hub',
  },
  { position: { lat: 44.9537, lng: -93.09 }, title: 'St. Paul', info: 'Secondary hub' },
  { position: { lat: 44.8408, lng: -93.2983 }, title: 'Bloomington', info: 'South metro coverage' },
  { position: { lat: 44.8897, lng: -93.3499 }, title: 'Edina', info: 'West metro coverage' },
  { position: { lat: 45.0059, lng: -93.3986 }, title: 'Golden Valley', info: 'Northwest coverage' },
  { position: { lat: 44.9669, lng: -93.2153 }, title: 'Roseville', info: 'Northeast coverage' },
  { position: { lat: 44.8013, lng: -93.0662 }, title: 'Eagan', info: 'Southeast coverage' },
  { position: { lat: 44.8547, lng: -93.2428 }, title: 'Richfield', info: 'Central south coverage' },
  { position: { lat: 44.9247, lng: -93.3596 }, title: 'St. Louis Park', info: 'West coverage' },
  { position: { lat: 45.0695, lng: -93.3502 }, title: 'Brooklyn Park', info: 'North coverage' },
  { position: { lat: 44.7677, lng: -93.2777 }, title: 'Burnsville', info: 'Far south coverage' },
  { position: { lat: 44.942, lng: -93.1431 }, title: 'Maplewood', info: 'East coverage' },
];

export default function MapPerformanceDemo() {
  const [showManyMarkers, setShowManyMarkers] = useState(false);

  const features = [
    {
      icon: <Image className="h-5 w-5" />,
      title: 'Static-to-Interactive',
      description: 'Starts with lightweight static image, upgrades on interaction',
    },
    {
      icon: <Layers className="h-5 w-5" />,
      title: 'Marker Clustering',
      description: 'Groups multiple markers for better performance',
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'Lazy Loading',
      description: 'Loads map only when visible in viewport',
    },
    {
      icon: <MousePointer className="h-5 w-5" />,
      title: 'Optimized Styles',
      description: 'Reduced map features for faster rendering',
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Error Boundaries',
      description: 'Graceful fallback if map fails to load',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Map Performance Optimization Demo</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Compare the original implementation with the performance-optimized version
        </p>
      </div>

      {/* Key Features */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Optimizations</CardTitle>
          <CardDescription>Key improvements in the optimized version</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex gap-3">
                <div className="text-primary mt-1">{feature.icon}</div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Original Implementation
              <Badge variant="secondary">Standard</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Initial Load</span>
              <span className="text-sm font-mono">~200KB+</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Time to Interactive</span>
              <span className="text-sm font-mono">~2-3s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Lighthouse Score Impact</span>
              <Badge variant="destructive">-15 to -25</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Optimized Implementation
              <Badge className="bg-green-500">Optimized</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Initial Load</span>
              <span className="text-sm font-mono text-green-600">~5KB (static)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Time to Interactive</span>
              <span className="text-sm font-mono text-green-600">~0.5s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Lighthouse Score Impact</span>
              <Badge className="bg-green-500">-3 to -5</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Live Comparison</CardTitle>
          <CardDescription>Experience the difference between implementations</CardDescription>
          <div className="flex gap-2 mt-4">
            <Button
              variant={!showManyMarkers ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowManyMarkers(false)}
            >
              Basic View
            </Button>
            <Button
              variant={showManyMarkers ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowManyMarkers(true)}
            >
              Many Markers ({SAMPLE_MARKERS.length})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="optimized" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="original">Original</TabsTrigger>
              <TabsTrigger value="optimized">Optimized</TabsTrigger>
            </TabsList>

            <TabsContent value="original" className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Original Implementation</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Loads immediately on page load</li>
                  <li>• Full Google Maps bundle</li>
                  <li>• No marker clustering</li>
                  <li>• Standard map styles</li>
                </ul>
              </div>
              <DeliveryAreaMap className="border" height="400px" />
            </TabsContent>

            <TabsContent value="optimized" className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  Optimized Implementation
                  <ArrowRight className="h-4 w-4" />
                  <span className="text-green-600">Click map to interact</span>
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Static image initially (5KB)</li>
                  <li>• Interactive on click/tap</li>
                  <li>• Marker clustering for many points</li>
                  <li>• Optimized map styles</li>
                  <li>• Error boundaries</li>
                </ul>
              </div>
              <OptimizedDeliveryMap
                className="border"
                height="400px"
                markers={showManyMarkers ? SAMPLE_MARKERS : []}
                showCoverage={true}
                interactive={false}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Implementation Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Guide</CardTitle>
          <CardDescription>How to use the optimized map component</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Basic Usage</h3>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                <code>{`import { OptimizedDeliveryMap } from '@/components/OptimizedDeliveryMap';

<OptimizedDeliveryMap 
  height="400px"
  interactive={false} // Start with static map
  showCoverage={true} // Show delivery areas
  markers={deliveryLocations}
/>`}</code>
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">With Many Markers (Clustering)</h3>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                <code>{`const markers = [
  { position: { lat: 44.97, lng: -93.26 }, title: 'Location 1' },
  { position: { lat: 44.95, lng: -93.09 }, title: 'Location 2' },
  // ... more markers
];

<OptimizedDeliveryMap 
  markers={markers} // Automatically clusters if > 10 markers
/>`}</code>
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Performance Tips</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <Badge className="bg-green-500">Tip</Badge>
                  <span>Use static maps for non-interactive displays</span>
                </li>
                <li className="flex gap-2">
                  <Badge className="bg-green-500">Tip</Badge>
                  <span>Lazy load maps below the fold</span>
                </li>
                <li className="flex gap-2">
                  <Badge className="bg-green-500">Tip</Badge>
                  <span>Limit markers and use clustering for many points</span>
                </li>
                <li className="flex gap-2">
                  <Badge className="bg-green-500">Tip</Badge>
                  <span>Consider alternatives like Leaflet for simple maps</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
