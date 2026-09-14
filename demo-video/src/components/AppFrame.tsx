import React from "react";
import { C, FONT } from "../lib/theme";
import { SIDEBAR_W } from "../lib/layout";
import { BrandMark, Wordmark } from "./Brand";

const NAV = [
  "Overview",
  "Findings",
  "Licenses & prices",
  "Renewals",
  "AI costs",
  "Connectors",
  "Settings",
] as const;

/**
 * The static app chrome: light sidebar with nav and the canvas content area.
 * `active` marks the current section; `scrollY` shifts the page content.
 */
export const AppFrame: React.FC<{
  scrollY?: number;
  active?: (typeof NAV)[number];
  children: React.ReactNode;
}> = ({ scrollY = 0, active = "Connectors", children }) => (
  <div
    style={{
      width: 1920,
      height: 1080,
      display: "flex",
      background: C.canvas,
      fontFamily: FONT.sans,
      overflow: "hidden",
    }}
  >
    <aside
      style={{
        width: SIDEBAR_W,
        flexShrink: 0,
        background: C.sidebar,
        borderRight: `1px solid ${C.sidebarLine}`,
        display: "flex",
        flexDirection: "column",
        zIndex: 2,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "26px 24px",
          borderBottom: `1px solid ${C.sidebarLine}`,
        }}
      >
        <BrandMark size={26} tone="light" />
        <Wordmark size={23} tone="light" />
      </div>

      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.sidebarLine}` }}>
        <div style={{ color: C.ink, fontSize: 17, fontWeight: 500 }}>
          Meridian Industries GmbH
        </div>
        <div
          style={{
            marginTop: 6,
            color: C.sidebarSoft,
            fontSize: 12,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Demo workspace
        </div>
      </div>

      <nav style={{ padding: "18px 0", flex: 1 }}>
        {NAV.map((item) => {
          const isActive = item === active;
          return (
            <React.Fragment key={item}>
              <div
                style={{
                  padding: "11px 24px",
                  fontSize: 17,
                  color: isActive ? C.ink : C.sidebarSoft,
                  fontWeight: isActive ? 500 : 400,
                  background: isActive ? C.brandSoft : "transparent",
                  borderLeft: `3px solid ${isActive ? C.brand : "transparent"}`,
                }}
              >
                {item}
              </div>

            </React.Fragment>
          );
        })}
      </nav>

      <div style={{ padding: "20px 24px", borderTop: `1px solid ${C.sidebarLine}` }}>
        <div style={{ color: C.ink, fontSize: 16, fontWeight: 500 }}>Demo Admin</div>
        <div
          style={{
            marginTop: 5,
            color: C.sidebarSoft,
            fontSize: 12,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Owner
        </div>
        <div style={{ marginTop: 12, color: C.sidebarSoft, fontSize: 15 }}>Sign out</div>
      </div>
    </aside>

    <main style={{ position: "relative", flex: 1, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: -SIDEBAR_W,
          width: 1920,
          transform: `translateY(${-scrollY}px)`,
        }}
      >
        {children}
      </div>
    </main>
  </div>
);
