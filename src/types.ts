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
  ownerId: string;
  ownerName: string;
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
  mobileNumber?: string;
  role: 'user' | 'admin' | 'superadmin';
  approvalStatus: 'pending' | 'approved' | 'rejected';
};

export type AdminSummary = {
  totalRooms: number;
  featuredRooms: number;
  avgPrice: number;
  totalMembers: number;
  pendingApprovals: number;
  cities: string[];
};

export type AdminMember = {
  id: string;
  name: string;
  email: string;
  mobileNumber?: string;
  role: 'admin' | 'superadmin';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy: string | null;
  createdAt: string;
};
