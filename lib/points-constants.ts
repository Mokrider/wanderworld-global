// Pure constants/logic only — safe to import from client components.
// Anything that touches the database lives in lib/points.ts instead.

export const POINTS_PER_DOLLAR_EARNED = 10;
export const POINTS_PER_DOLLAR_REDEEMED = 100;

export type Tier = "Explorer" | "Voyager" | "Globetrotter";

const TIERS: { name: Tier; minLifetimePoints: number }[] = [
  { name: "Globetrotter", minLifetimePoints: 10_000 },
  { name: "Voyager", minLifetimePoints: 2_000 },
  { name: "Explorer", minLifetimePoints: 0 },
];

export function getTier(lifetimePoints: number): Tier {
  return TIERS.find((t) => lifetimePoints >= t.minLifetimePoints)!.name;
}
