import React from "react";
import { useCurrentFrame } from "remotion";
import { AppFrame } from "../components/AppFrame";
import { Card } from "../components/ui";
import { LineChart, wave } from "../components/LineChart";
import { enter, prog } from "../lib/anim";
import { C, FONT, SHADOW } from "../lib/theme";
import { CONTENT_X, CONTENT_W, PAD_TOP, CARD_PAD_X } from "../lib/layout";
import { euros } from "../lib/format";

const METRICS = [
  { label: "Monthly license spend", cents: 697990, sub: "263 assigned seats", tone: C.ink },
  { label: "Monthly waste", cents: 297986, sub: "42.7% of spend", tone: C.wasteText },
  { label: "Annualized waste", cents: 3575832, sub: "if nothing changes", tone: C.wasteText },
  { label: "Open findings", count: 65, sub: "across 15 rules", tone: C.ink },
] as const;

const FINDINGS = [
  { chip: "Shelfware", tone: "slate", title: "Unassigned paid seats: Microsoft 365 E3 (16)", cents: 67500 },
  { chip: "Disabled", tone: "danger", title: "Disabled account still licensed: Clara Becker", cents: 5999 },
  { chip: "Disabled", tone: "danger", title: "Disabled account still licensed: David Hoffmann", cents: 5999 },
  { chip: "Copilot idle", tone: "plum", title: "Copilot seat unused: Jonas Maier", cents: 3000 },
  { chip: "Inactive", tone: "gold", title: "No activity for 95 days: Felix Hoffmann", cents: 1499 },
  { chip: "Guest", tone: "teal", title: "Licensed guest account: Paul Wagner", cents: 1499 },
] as const;

const CHIP_TONES: Record<string, { bg: string; fg: string }> = {
  danger: { bg: C.dangerSoft, fg: C.dangerText },
  gold: { bg: C.goldSoft, fg: C.gold },
  slate: { bg: C.slateSoft, fg: C.slateInk },
  plum: { bg: "#f1e9ff", fg: "#7c3aed" },
  teal: { bg: "#def2f7", fg: "#0e7490" },
};

const CARD_W = (CONTENT_W - 3 * 24) / 4;
const METRICS_TOP = PAD_TOP + 96;
const PANEL_TOP = METRICS_TOP + 172;
const CHART_W = 820;
const LIST_X = CONTENT_X + CHART_W + 32;
const LIST_W = CONTENT_W - CHART_W - 32;

const SPEND_SERIES = wave(46, 100, 2.2, -1, 1.3);
const WASTE_SERIES = wave(46, 46, 2.6, -3.5, 4.1);

/**
 * Short-form clip of the Overview dashboard: metric cards count up, the
 * 45-day trend draws on, and the largest open findings cascade in.
 */
export const OverviewClip: React.FC = () => {
  const frame = useCurrentFrame();
  const count = prog(frame, 10, 46);
  const chart = prog(frame, 26, 64);

  return (
    <AppFrame active="Overview">
      {/* Header */}
      <div style={{ position: "absolute", left: CONTENT_X, top: PAD_TOP, ...enter(frame, 0) }}>
        <div style={{ fontFamily: FONT.sans, fontSize: 42, fontWeight: 600, letterSpacing: "-0.02em", color: C.ink }}>
          Overview
        </div>
        <div style={{ marginTop: 6, fontFamily: FONT.sans, fontSize: 16, color: C.inkFaint }}>
          Last synced 2 h ago
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: CONTENT_X + CONTENT_W - 290,
          top: PAD_TOP + 8,
          display: "flex",
          gap: 12,
          ...enter(frame, 4),
        }}
      >
        {["PDF report", "Sync now"].map((label) => (
          <div
            key={label}
            style={{
              borderRadius: 12,
              border: `1px solid ${C.lineStrong}`,
              background: C.card,
              padding: "11px 20px",
              fontFamily: FONT.sans,
              fontSize: 15,
              fontWeight: 500,
              color: C.inkSoft,
              boxShadow: SHADOW.card,
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Metric cards */}
      {METRICS.map((m, i) => {
        const value =
          "count" in m && m.count !== undefined
            ? Math.round(m.count * count).toString()
            : `${euros(Math.round((m as { cents: number }).cents * count))} €`;
        return (
          <div
            key={m.label}
            style={{
              position: "absolute",
              left: CONTENT_X + i * (CARD_W + 24),
              top: METRICS_TOP,
              width: CARD_W,
              background: C.card,
              border: `1px solid ${C.line}`,
              borderRadius: 20,
              boxShadow: SHADOW.card,
              padding: "22px 26px",
              ...enter(frame, 4 + i * 4),
            }}
          >
            <div
              style={{
                fontFamily: FONT.sans,
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                color: C.inkFaint,
              }}
            >
              {m.label}
            </div>
            <div
              style={{
                marginTop: 12,
                fontFamily: FONT.sans,
                fontSize: 38,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
                color: m.tone,
                whiteSpace: "nowrap",
              }}
            >
              {value}
            </div>
            <div style={{ marginTop: 8, fontFamily: FONT.sans, fontSize: 14, color: C.inkFaint }}>
              {m.sub}
            </div>
          </div>
        );
      })}

      {/* Trend chart */}
      <div
        style={{
          position: "absolute",
          left: CONTENT_X,
          top: PANEL_TOP,
          width: CHART_W,
          ...enter(frame, 18),
        }}
      >
        <Card
          title="Trend (45 days)"
          headerRight={
            <span style={{ fontFamily: FONT.sans, fontSize: 15, color: C.inkFaint }}>
              Waste 3.100 €{" "}
              <span style={{ color: C.wasteText, fontWeight: 500 }}>→ 2.979,86 €/mo</span>
            </span>
          }
        >
          <div style={{ padding: `26px ${CARD_PAD_X}px 8px` }}>
            <LineChart
              width={CHART_W - CARD_PAD_X * 2}
              height={300}
              progress={chart}
              series={[
                { points: SPEND_SERIES, color: C.inkFaint, width: 3 },
                { points: WASTE_SERIES, color: C.waste, fill: "rgba(245, 158, 11, 0.10)", width: 3 },
              ]}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 10,
                fontFamily: FONT.mono,
                fontSize: 13,
                color: C.inkFaint,
              }}
            >
              <span>27 Apr</span>
              <span>11 Jun</span>
            </div>
            <div style={{ display: "flex", gap: 26, marginTop: 12, paddingBottom: 8 }}>
              {[
                { label: "Monthly spend", color: C.inkFaint },
                { label: "Monthly waste", color: C.waste },
              ].map((l) => (
                <span
                  key={l.label}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: FONT.sans,
                    fontSize: 14,
                    color: C.inkSoft,
                  }}
                >
                  <span style={{ width: 22, height: 3, background: l.color, borderRadius: 2 }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Largest open findings */}
      <div
        style={{
          position: "absolute",
          left: LIST_X,
          top: PANEL_TOP,
          width: LIST_W,
          ...enter(frame, 24),
        }}
      >
        <Card
          title="Largest open findings"
          headerRight={
            <span style={{ fontFamily: FONT.sans, fontSize: 15, color: C.brandText, fontWeight: 500 }}>
              All findings →
            </span>
          }
        >
          {FINDINGS.map((f, i) => {
            const tone = CHIP_TONES[f.tone] ?? { bg: C.slateSoft, fg: C.slateInk };
            return (
              <div
                key={f.title}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: `15px ${CARD_PAD_X}px`,
                  borderTop: i === 0 ? "none" : `1px solid ${C.line}`,
                  ...enter(frame, 40 + i * 6, 14, 10),
                }}
              >
                <span
                  style={{
                    borderRadius: 999,
                    padding: "4px 12px",
                    fontFamily: FONT.sans,
                    fontSize: 13,
                    fontWeight: 500,
                    background: tone.bg,
                    color: tone.fg,
                    whiteSpace: "nowrap",
                  }}
                >
                  {f.chip}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontFamily: FONT.sans,
                    fontSize: 15.5,
                    color: C.inkSoft,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {f.title}
                </span>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 15,
                    color: C.wasteText,
                    whiteSpace: "nowrap",
                  }}
                >
                  {euros(f.cents)} €/mo
                </span>
              </div>
            );
          })}
        </Card>
      </div>
    </AppFrame>
  );
};
