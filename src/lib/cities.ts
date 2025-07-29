export interface City {
  id: string;
  name: string;
  slug: string;
  county: string;
  zipCodes: string[];
  population?: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  metaDescription: string;
  heroDescription: string;
  deliveryTime: string;
  minimumOrder: number;
  deliveryFee: number;
}

export const TWIN_CITIES_SUBURBS: City[] = [
  {
    id: 'minneapolis',
    name: 'Minneapolis',
    slug: 'minneapolis',
    county: 'Hennepin',
    zipCodes: [
      '55401',
      '55402',
      '55403',
      '55404',
      '55405',
      '55406',
      '55407',
      '55408',
      '55409',
      '55410',
      '55411',
      '55412',
      '55413',
      '55414',
      '55415',
      '55416',
      '55417',
      '55418',
      '55419',
      '55454',
      '55455',
    ],
    population: 429954,
    coordinates: { lat: 44.9778, lng: -93.265 },
    metaDescription:
      'Same-day cannabis delivery in Minneapolis. Premium flower, edibles, and concentrates delivered discreetly to your door. Order now for fast, reliable service.',
    heroDescription:
      "Minneapolis's premier cannabis delivery service. Get premium products delivered same-day throughout Minneapolis.",
    deliveryTime: '1-2 hours',
    minimumOrder: 50,
    deliveryFee: 0,
  },
  {
    id: 'st-paul',
    name: 'St. Paul',
    slug: 'st-paul',
    county: 'Ramsey',
    zipCodes: [
      '55101',
      '55102',
      '55103',
      '55104',
      '55105',
      '55106',
      '55107',
      '55108',
      '55116',
      '55117',
      '55119',
      '55130',
    ],
    population: 311527,
    coordinates: { lat: 44.9537, lng: -93.09 },
    metaDescription:
      'Fast cannabis delivery in St. Paul, MN. Shop quality flower, edibles, concentrates & more. Discreet same-day delivery to your door. Order online now.',
    heroDescription:
      "St. Paul's trusted cannabis delivery service. Premium products, competitive prices, and same-day delivery.",
    deliveryTime: '1-2 hours',
    minimumOrder: 50,
    deliveryFee: 0,
  },
  {
    id: 'bloomington',
    name: 'Bloomington',
    slug: 'bloomington',
    county: 'Hennepin',
    zipCodes: ['55420', '55425', '55431', '55435', '55437', '55438'],
    population: 89987,
    coordinates: { lat: 44.8408, lng: -93.2983 },
    metaDescription:
      'Cannabis delivery in Bloomington, MN. Premium marijuana products delivered same-day. Flower, edibles, concentrates & more. Order online for fast delivery.',
    heroDescription:
      "Bloomington's go-to cannabis delivery service. Quality products delivered discreetly to your door.",
    deliveryTime: '2-3 hours',
    minimumOrder: 75,
    deliveryFee: 10,
  },
  {
    id: 'plymouth',
    name: 'Plymouth',
    slug: 'plymouth',
    county: 'Hennepin',
    zipCodes: ['55441', '55442', '55446', '55447'],
    population: 81026,
    coordinates: { lat: 45.0105, lng: -93.4555 },
    metaDescription:
      'Weed delivery in Plymouth, MN. Top-quality cannabis products delivered same-day. Browse our selection of flower, edibles, and more. Order now!',
    heroDescription:
      'Plymouth residents trust DankDeals for premium cannabis delivery. Fast, discreet, and reliable service.',
    deliveryTime: '2-3 hours',
    minimumOrder: 75,
    deliveryFee: 10,
  },
  {
    id: 'maple-grove',
    name: 'Maple Grove',
    slug: 'maple-grove',
    county: 'Hennepin',
    zipCodes: ['55311', '55369'],
    population: 70253,
    coordinates: { lat: 45.0724, lng: -93.4558 },
    metaDescription:
      'Maple Grove cannabis delivery service. Get marijuana delivered same-day. Premium flower, edibles, vapes & more. Discreet delivery to your door.',
    heroDescription:
      "Maple Grove's premier cannabis delivery. Quality products, competitive prices, same-day service.",
    deliveryTime: '2-3 hours',
    minimumOrder: 75,
    deliveryFee: 10,
  },
  {
    id: 'edina',
    name: 'Edina',
    slug: 'edina',
    county: 'Hennepin',
    zipCodes: ['55343', '55435', '55436', '55439'],
    population: 53494,
    coordinates: { lat: 44.8897, lng: -93.3501 },
    metaDescription:
      'Cannabis delivery in Edina, MN. Premium marijuana products delivered discreetly same-day. Shop flower, edibles, concentrates online. Fast delivery.',
    heroDescription:
      "Edina's trusted source for premium cannabis delivery. Exceptional products and service.",
    deliveryTime: '1-2 hours',
    minimumOrder: 75,
    deliveryFee: 10,
  },
  {
    id: 'eden-prairie',
    name: 'Eden Prairie',
    slug: 'eden-prairie',
    county: 'Hennepin',
    zipCodes: ['55344', '55346', '55347'],
    population: 64198,
    coordinates: { lat: 44.8547, lng: -93.4708 },
    metaDescription:
      'Eden Prairie weed delivery. Same-day cannabis delivery service. Quality flower, edibles, and concentrates. Order online for fast, discreet delivery.',
    heroDescription:
      "Eden Prairie's premier cannabis delivery service. Premium products delivered to your door.",
    deliveryTime: '2-3 hours',
    minimumOrder: 75,
    deliveryFee: 10,
  },
  {
    id: 'minnetonka',
    name: 'Minnetonka',
    slug: 'minnetonka',
    county: 'Hennepin',
    zipCodes: ['55305', '55343', '55345', '55391'],
    population: 53781,
    coordinates: { lat: 44.9211, lng: -93.4687 },
    metaDescription:
      'Minnetonka cannabis delivery. Get marijuana delivered same-day. Premium products including flower, edibles, vapes & more. Order now for fast delivery.',
    heroDescription:
      'Minnetonka residents choose DankDeals for reliable cannabis delivery. Quality guaranteed.',
    deliveryTime: '2-3 hours',
    minimumOrder: 75,
    deliveryFee: 10,
  },
  {
    id: 'burnsville',
    name: 'Burnsville',
    slug: 'burnsville',
    county: 'Dakota',
    zipCodes: ['55306', '55337'],
    population: 64317,
    coordinates: { lat: 44.7677, lng: -93.2777 },
    metaDescription:
      'Burnsville weed delivery service. Same-day cannabis delivery. Shop premium flower, edibles, concentrates online. Fast, discreet delivery to your door.',
    heroDescription:
      "Burnsville's go-to cannabis delivery service. Premium selection, competitive prices.",
    deliveryTime: '2-3 hours',
    minimumOrder: 75,
    deliveryFee: 10,
  },
  {
    id: 'woodbury',
    name: 'Woodbury',
    slug: 'woodbury',
    county: 'Washington',
    zipCodes: ['55125', '55129'],
    population: 75102,
    coordinates: { lat: 44.9239, lng: -92.9594 },
    metaDescription:
      'Cannabis delivery in Woodbury, MN. Premium marijuana products delivered same-day. Browse flower, edibles, vapes & more. Order online now.',
    heroDescription:
      "Woodbury's trusted cannabis delivery partner. Fast, reliable, and discreet service.",
    deliveryTime: '2-3 hours',
    minimumOrder: 75,
    deliveryFee: 10,
  },
  {
    id: 'lakeville',
    name: 'Lakeville',
    slug: 'lakeville',
    county: 'Dakota',
    zipCodes: ['55044'],
    population: 69490,
    coordinates: { lat: 44.6496, lng: -93.2428 },
    metaDescription:
      'Lakeville marijuana delivery. Same-day weed delivery service. Quality cannabis products including flower, edibles, concentrates. Order for fast delivery.',
    heroDescription:
      "Lakeville's premier cannabis delivery service. Quality products, exceptional service.",
    deliveryTime: '2-3 hours',
    minimumOrder: 75,
    deliveryFee: 10,
  },
  {
    id: 'blaine',
    name: 'Blaine',
    slug: 'blaine',
    county: 'Anoka',
    zipCodes: ['55014', '55434', '55449'],
    population: 70222,
    coordinates: { lat: 45.1608, lng: -93.2349 },
    metaDescription:
      'Blaine cannabis delivery service. Get weed delivered same-day. Premium flower, edibles, and more. Fast, discreet delivery to your door in Blaine, MN.',
    heroDescription:
      'Blaine residents trust DankDeals for premium cannabis delivery. Same-day service available.',
    deliveryTime: '2-3 hours',
    minimumOrder: 75,
    deliveryFee: 10,
  },
  {
    id: 'richfield',
    name: 'Richfield',
    slug: 'richfield',
    county: 'Hennepin',
    zipCodes: ['55423'],
    population: 36994,
    coordinates: { lat: 44.8833, lng: -93.2833 },
    metaDescription:
      'Richfield weed delivery. Same-day cannabis delivery in Richfield, MN. Shop quality flower, edibles, concentrates online. Fast, discreet service.',
    heroDescription:
      "Richfield's convenient cannabis delivery service. Premium products, competitive prices.",
    deliveryTime: '1-2 hours',
    minimumOrder: 50,
    deliveryFee: 5,
  },
  {
    id: 'roseville',
    name: 'Roseville',
    slug: 'roseville',
    county: 'Ramsey',
    zipCodes: ['55113'],
    population: 36254,
    coordinates: { lat: 45.0061, lng: -93.1544 },
    metaDescription:
      'Cannabis delivery in Roseville, MN. Premium marijuana products delivered same-day. Browse our selection of flower, edibles, vapes. Order online now.',
    heroDescription:
      "Roseville's trusted cannabis delivery partner. Quality products, fast service.",
    deliveryTime: '1-2 hours',
    minimumOrder: 50,
    deliveryFee: 5,
  },
  {
    id: 'eagan',
    name: 'Eagan',
    slug: 'eagan',
    county: 'Dakota',
    zipCodes: ['55121', '55122', '55123'],
    population: 68855,
    coordinates: { lat: 44.8041, lng: -93.1669 },
    metaDescription:
      'Eagan marijuana delivery service. Same-day weed delivery. Quality cannabis products including flower, edibles, concentrates. Order for fast delivery.',
    heroDescription: "Eagan's premier cannabis delivery. Premium selection, exceptional service.",
    deliveryTime: '2-3 hours',
    minimumOrder: 75,
    deliveryFee: 10,
  },
  {
    id: 'coon-rapids',
    name: 'Coon Rapids',
    slug: 'coon-rapids',
    county: 'Anoka',
    zipCodes: ['55433', '55448'],
    population: 63599,
    coordinates: { lat: 45.12, lng: -93.2875 },
    metaDescription:
      'Coon Rapids cannabis delivery. Get marijuana delivered same-day. Premium flower, edibles, vapes & more. Fast, discreet delivery in Coon Rapids, MN.',
    heroDescription:
      "Coon Rapids' go-to cannabis delivery service. Quality guaranteed, same-day delivery.",
    deliveryTime: '2-3 hours',
    minimumOrder: 75,
    deliveryFee: 10,
  },
  {
    id: 'apple-valley',
    name: 'Apple Valley',
    slug: 'apple-valley',
    county: 'Dakota',
    zipCodes: ['55124'],
    population: 55135,
    coordinates: { lat: 44.7319, lng: -93.2177 },
    metaDescription:
      'Apple Valley weed delivery service. Same-day cannabis delivery. Shop premium flower, edibles, concentrates online. Fast delivery to Apple Valley, MN.',
    heroDescription:
      "Apple Valley's trusted cannabis delivery partner. Premium products, reliable service.",
    deliveryTime: '2-3 hours',
    minimumOrder: 75,
    deliveryFee: 10,
  },
  {
    id: 'shakopee',
    name: 'Shakopee',
    slug: 'shakopee',
    county: 'Scott',
    zipCodes: ['55379'],
    population: 43698,
    coordinates: { lat: 44.7974, lng: -93.5269 },
    metaDescription:
      'Shakopee cannabis delivery. Premium marijuana products delivered same-day. Browse flower, edibles, concentrates & more. Order online for fast delivery.',
    heroDescription:
      "Shakopee's premier cannabis delivery service. Quality products, competitive prices.",
    deliveryTime: '2-3 hours',
    minimumOrder: 75,
    deliveryFee: 10,
  },
];

export function getCityBySlug(slug: string): City | undefined {
  return TWIN_CITIES_SUBURBS.find((city) => city.slug === slug);
}

export function getCitiesByCounty(county: string): City[] {
  return TWIN_CITIES_SUBURBS.filter((city) => city.county === county);
}

export function getNearestCities(lat: number, lng: number, limit = 5): City[] {
  return TWIN_CITIES_SUBURBS.map((city) => ({
    ...city,
    distance: Math.sqrt(
      Math.pow(city.coordinates.lat - lat, 2) + Math.pow(city.coordinates.lng - lng, 2)
    ),
  }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}
