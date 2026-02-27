// Carbon calculation constants (kg CO2e per unit)
export const CARBON_FACTORS = {
  car: 0.4,           // kg CO2 per mile
  transit: 0.089,     // kg CO2 per mile (equivalent)
  flight: 1100,       // kg CO2 per round-trip flight
  electricity: 0.386, // kg CO2 per kWh
  naturalGas: 5.3,    // kg CO2 per therm
  oil: 10.15,         // kg CO2 per gallon

  // Diet annual tons CO2e
  meatLover: 3.3,
  average: 2.5,
  vegetarian: 1.7,
  vegan: 1.5,

  // Waste factors
  recyclingAlways: 0.2,
  recyclingSometimes: 0.4,
  recyclingNever: 0.8,
  composting: -0.05,
} as const;

export const COMPARISON_EQUIVALENTS = [
  { factor: 11.4, unit: "phone charges per ton", text: "charging your phone {n} million times" },
  { factor: 0.5, unit: "flights per ton", text: "{n} round-trip flights from NYC to London" },
  { factor: 4.6, unit: "months of driving per ton", text: "{n} months of average driving" },
  { factor: 50, unit: "trees per ton", text: "planting {n} trees" },
  { factor: 21, unit: "trash bags per ton", text: "diverting {n} trash bags from landfill" },
];

export const DIET_OPTIONS = [
  { id: "meat_lover" as const, label: "Meat Lover", emoji: "🥩", color: "#ef4444", description: "Meat at every meal", co2: 3.3 },
  { id: "average" as const, label: "Average", emoji: "🍽️", color: "#f59e0b", description: "Meat a few times a week", co2: 2.5 },
  { id: "vegetarian" as const, label: "Vegetarian", emoji: "🥗", color: "#22c55e", description: "No meat, dairy ok", co2: 1.7 },
  { id: "vegan" as const, label: "Vegan", emoji: "🌱", color: "#4CD964", description: "Fully plant-based", co2: 1.5 },
];

export const HEATING_OPTIONS = [
  { id: "natural_gas" as const, label: "Natural Gas", emoji: "🔥", description: "Most common in US" },
  { id: "oil" as const, label: "Oil", emoji: "🛢️", description: "Common in Northeast" },
  { id: "electric" as const, label: "Electric", emoji: "⚡", description: "Resistance heating" },
  { id: "renewable" as const, label: "Renewable", emoji: "☀️", description: "Solar, heat pump, etc." },
];

export const RECYCLING_OPTIONS = [
  { id: "always" as const, label: "Always", emoji: "♻️", color: "#4CD964" },
  { id: "sometimes" as const, label: "Sometimes", emoji: "🤔", color: "#f59e0b" },
  { id: "never" as const, label: "Never", emoji: "🗑️", color: "#ef4444" },
];

export const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/suggestions", label: "AI Suggestions" },
  { href: "/simulation", label: "Simulation" },
  { href: "/profile", label: "Profile" },
  { href: "/history", label: "History" },
];

export const LEVELS = [
  { level: 1, title: "Seedling", minPoints: 0 },
  { level: 2, title: "Sprout", minPoints: 100 },
  { level: 3, title: "Sapling", minPoints: 250 },
  { level: 4, title: "Young Tree", minPoints: 500 },
  { level: 5, title: "Tree Hugger", minPoints: 800 },
  { level: 6, title: "Forest Friend", minPoints: 1200 },
  { level: 7, title: "Eco Warrior", minPoints: 1700 },
  { level: 8, title: "Green Guardian", minPoints: 2400 },
  { level: 9, title: "Earth Defender", minPoints: 3200 },
  { level: 10, title: "Planet Savior", minPoints: 4200 },
];

export const FUN_FACTS = {
  transport: "1 mile by car = 0.4 kg CO₂. Carpooling with one person cuts it in half!",
  energy: "LED bulbs use 75% less energy than incandescent. One bulb = 0.03 tons CO₂/year saved.",
  diet: "A vegan diet saves about 1.5 tons CO₂ per year compared to average meat consumption.",
  waste: "Recycling one aluminum can saves enough energy to run your TV for 3 hours!",
};
