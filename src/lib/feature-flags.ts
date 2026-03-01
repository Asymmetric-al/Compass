export function isGoalsWorkboardV2Enabled() {
  return process.env.NEXT_PUBLIC_COMPASS_V2_ENABLED !== "false";
}
