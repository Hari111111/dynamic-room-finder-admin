export type NearbyPlace = {
  _id?: string;
  id?: string;
  name: string;
  category: string;
  distanceKm: number;
  walkMinutes: number;
  highlight: string;
};

export type Room = {
  _id: string;
  title: string;
  city: string;
  locality: string;
  address: string;
  price: number;
  deposit: number;
  rating: number;
  reviewCount: number;
  occupancy: 'Single' | 'Double' | 'Shared';
  roomType: 'Private Room' | 'Studio' | 'PG' | 'Coliving';
  gender: 'Any' | 'Boys' | 'Girls';
  availableFrom: string;
  seatsLeft: number;
  description: string;
  heroTag: string;
  image: string;
  amenities: string[];
  rules: string[];
  transit: string[];
  nearbyPlaces: NearbyPlace[];
  featured: boolean;
  updatedAt: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
};

export type AdminSummary = {
  totalRooms: number;
  featuredRooms: number;
  avgPrice: number;
  totalUsers: number;
  admins: number;
  cities: string[];
};
