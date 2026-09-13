/** LicenseMeter is free. Historical payment records never restrict access. */
export type Entitlement = {
  state: "free" | "demo";
  active: true;
  locked: false;
};

export function entitlementOf(tenant: { isDemo: boolean }): Entitlement {
  return {
    state: tenant.isDemo ? "demo" : "free",
    active: true,
    locked: false,
  };
}
