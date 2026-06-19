export interface LocationDetail {
  label: string;
  address: string;
  lat: number;
  lng: number;
}

export const PRESET_CATEGORIES: Record<string, LocationDetail[]> = {
  airport: [
    {
      label: "San Francisco International Airport (SFO)",
      address: "SFO Airport, Terminal 2, San Francisco, CA 94128",
      lat: 37.6213,
      lng: -122.3790,
    },
    {
      label: "Oakland International Airport (OAK)",
      address: "OAK Airport, 1 Airport Dr, Oakland, CA 94621",
      lat: 37.7126,
      lng: -122.2197,
    },
    {
      label: "San Jose Mineta International Airport (SJC)",
      address: "SJC Airport, 1701 Airport Blvd, San Jose, CA 95110",
      lat: 37.3639,
      lng: -121.9289,
    },
  ],
  eatery: [
    {
      label: "Tartine Bakery",
      address: "600 Guerrero St, San Francisco, CA 94110",
      lat: 37.7614,
      lng: -122.4240,
    },
    {
      label: "State Bird Provisions",
      address: "1520 Fillmore St, San Francisco, CA 94115",
      lat: 37.7837,
      lng: -122.4330,
    },
    {
      label: "Sotto Mare Seafood",
      address: "527 Green St, San Francisco, CA 94133",
      lat: 37.7997,
      lng: -122.4080,
    },
    {
      label: "Swan Oyster Depot",
      address: "1517 Polk St, San Francisco, CA 94109",
      lat: 37.7908,
      lng: -122.4208,
    },
    {
      label: "Zuni Café",
      address: "1658 Market St, San Francisco, CA 94102",
      lat: 37.7737,
      lng: -122.4217,
    },
  ],
  hospital: [
    {
      label: "UCSF Medical Center at Mission Bay",
      address: "1825 4th St, San Francisco, CA 94158",
      lat: 37.7677,
      lng: -122.3912,
    },
    {
      label: "San Francisco General Hospital",
      address: "1001 Potrero Ave, San Francisco, CA 94110",
      lat: 37.7554,
      lng: -122.4084,
    },
    {
      label: "Saint Francis Memorial Hospital",
      address: "900 Hyde St, San Francisco, CA 94109",
      lat: 37.7895,
      lng: -122.4170,
    },
    {
      label: "Kaiser Permanente SF Medical Center",
      address: "2425 Geary Blvd, San Francisco, CA 94115",
      lat: 37.7831,
      lng: -122.4426,
    },
  ],
  other: [
    {
      label: "Golden Gate Park",
      address: "Golden Gate Park, San Francisco, CA",
      lat: 37.7694,
      lng: -122.4862,
    },
    {
      label: "Ferry Building Marketplace",
      address: "1 Ferry Building, San Francisco, CA 94111",
      lat: 37.7955,
      lng: -122.3937,
    },
    {
      label: "Chinatown SF",
      address: "Grant Ave & Bush St, San Francisco, CA 94108",
      lat: 37.7908,
      lng: -122.4056,
    },
    {
      label: "Equinox Sports Club SF",
      address: "747 Market St, San Francisco, CA 94103",
      lat: 37.7861,
      lng: -122.4042,
    },
    {
      label: "Union Square",
      address: "333 Post St, San Francisco, CA 94108",
      lat: 37.7880,
      lng: -122.4075,
    },
    {
      label: "Fisherman's Wharf",
      address: "286 Jefferson St, San Francisco, CA 94133",
      lat: 37.8080,
      lng: -122.4177,
    },
  ],
};

function getStableHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

/** Resolves standard text queries and place references into concrete named locations with coordinates. */
export function resolveLocationDetails(text: string, placeRef?: string | null): LocationDetail {
  const query = text.trim().toLowerCase();

  // 1. Direct exact checks for preset labels/addresses/keywords
  for (const cat of Object.values(PRESET_CATEGORIES)) {
    for (const item of cat) {
      const lowerLabel = item.label.toLowerCase();
      const lowerAddr = item.address.toLowerCase();
      
      if (
        query.includes(lowerLabel) ||
        lowerLabel.includes(query) ||
        query.includes(lowerAddr) ||
        (query.includes("sfo") && lowerLabel.includes("sfo")) ||
        (query.includes("oak") && lowerLabel.includes("oak")) ||
        (query.includes("sjc") && lowerLabel.includes("sjc")) ||
        (query.includes("kaiser") && lowerLabel.includes("kaiser")) ||
        (query.includes("tartine") && lowerLabel.includes("tartine")) ||
        (query.includes("state bird") && lowerLabel.includes("state bird")) ||
        (query.includes("sotto mare") && lowerLabel.includes("sotto mare")) ||
        (query.includes("swan oyster") && lowerLabel.includes("swan oyster")) ||
        (query.includes("zuni") && lowerLabel.includes("zuni")) ||
        (query.includes("ucsf") && lowerLabel.includes("ucsf")) ||
        (query.includes("general hospital") && lowerLabel.includes("general hospital")) ||
        (query.includes("saint francis") && lowerLabel.includes("saint francis"))
      ) {
        return item;
      }
    }
  }

  const getStableItem = (arr: LocationDetail[]) => {
    const hash = getStableHash(query);
    return arr[hash % arr.length];
  };

  // 2. Check placeRef / categories for generic matching
  if (placeRef === "airport" || query.includes("airport")) {
    return getStableItem(PRESET_CATEGORIES.airport);
  }
  if (query.includes("hospital") || query.includes("medical center") || query.includes("clinic") || query.includes("er ")) {
    return getStableItem(PRESET_CATEGORIES.hospital);
  }
  if (
    query.includes("eatery") ||
    query.includes("restaurant") ||
    query.includes("cafe") ||
    query.includes("bakery") ||
    query.includes("food") ||
    query.includes("dinner") ||
    query.includes("lunch")
  ) {
    return getStableItem(PRESET_CATEGORIES.eatery);
  }

  // 3. Fallback for custom entries (deterministic coordinates inside SF bounds)
  const hash = getStableHash(query);
  const deltaLat = ((hash % 1000) / 1000) * 0.08 - 0.04; // +/- 0.04 degrees
  const deltaLng = (((hash >> 3) % 1000) / 1000) * 0.1 - 0.05; // +/- 0.05 degrees

  // Capitalize name nicely
  const words = text.split(/\s+/);
  const cleanLabel = words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // Ensure default coordinate center (Union Square SF)
  const baseLat = 37.7880;
  const baseLng = -122.4075;

  return {
    label: cleanLabel,
    address: `${cleanLabel}, San Francisco, CA`,
    lat: baseLat + deltaLat,
    lng: baseLng + deltaLng,
  };
}
