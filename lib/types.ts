export type TripSettings = Record<string, string>;

export type ItineraryItem = {
  id: string; day: string; date: string; from: string; to: string;
  distanceKm: string; rideType: string; notes: string; sortOrder: string;
};
export type PackingItem = { id: string; label: string; category: string; packed: string; sortOrder: string };
export type Expense = { id: string; date: string; label: string; amount: string; category: string; notes: string };
export type RidePrepItem = { id: string; label: string; checked: string; category: string; sortOrder: string };
export type TripNote = { id: string; title: string; body: string; sortOrder: string };

export type TripData = {
  trip: TripSettings; itinerary: ItineraryItem[]; packing: PackingItem[];
  expenses: Expense[]; ridePrep: RidePrepItem[]; notes: TripNote[];
};

export type CollectionName = "itinerary" | "packing" | "expenses" | "ridePrep" | "notes";
