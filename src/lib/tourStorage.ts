export type TourPhase = "welcome" | "data";

export const tourStorageKey = (membershipId: string, phase: TourPhase) =>
  `licensemeter:tour:${membershipId}:${phase}`;
