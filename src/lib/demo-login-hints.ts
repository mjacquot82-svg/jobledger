const DEMO_EMAIL = "demo@jobledger.local";
const DEMO_PASSWORD = "DemoPass123!";

export type DemoLoginEnv = {
  nodeEnv?: string;
  allowDemoLoginHint?: string;
};

/**
 * Demo credentials are only surfaced outside production, or when an
 * explicit override is set. Production with default env gets an empty form.
 */
export function getLoginDemoHints(env: DemoLoginEnv = {}) {
  const nodeEnv = env.nodeEnv ?? "production";
  const allow =
    nodeEnv !== "production" || env.allowDemoLoginHint === "true";

  if (!allow) {
    return {
      email: "",
      password: "",
      showHint: false as const,
      hintText: null as string | null,
    };
  }

  return {
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    showHint: true as const,
    hintText: `Demo login is prefilled: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`,
  };
}
