// Demo mode shows the "quick login by role" buttons and the reset-demo tool.
// To prepare for production: set NEXT_PUBLIC_DEMO_MODE="false" in your env,
// which hides all demo-only UI in one step.
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
