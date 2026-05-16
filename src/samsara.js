import { config } from "./config.js";

/**
 * MVP stub: wire your vehicle id -> Samsara stats call here.
 * Docs: GET /fleet/vehicles/stats?types=gps
 */
export async function fetchVehicleGpsHint() {
  if (!config.samsaraApiToken) {
    return { ok: false, reason: "SAMSARA_API_TOKEN not set" };
  }
  return {
    ok: false,
    reason: "Implement Samsara lookup (vehicle id from sheet) in src/samsara.js",
  };
}
