import React from "react";
import { useCurrentFrame } from "remotion";
import { AppFrame } from "../components/AppFrame";
import { Card } from "../components/ui";
import { LineChart, wave } from "../components/LineChart";
import { enter, prog } from "../lib/anim";
import { C, FONT, SHADOW } from "../lib/theme";
import { CONTENT_X, CONTENT_W, PAD_TOP, CARD_PAD_X } from "../lib/layout";
import { euros } from "../lib/format";

/* USD figures follow the app's de-DE grouping with a $ prefix. */
const usd = (cents: number) => `$${euros(cents)}`;

const STATS = [
  { label: "Total AI spend this month", cents: 184217, sub: "all providers, calendar month" },
  { label: "Total AI spend last 30 days", cents: 210640, sub: "all providers, rolling window" },
  { label: "OpenAI this month", cents: 123456, sub: "calendar month, UTC" },
  { label: "Anthropic this month", cents: 60761, sub: "calendar month, UTC" },
] as const;

const CATEGORIES = [
  { name: "gpt-4o", provider: "OpenAI", cents: 81240 },
  { name: "claude-opus", provider: "Anthropic", cents: 40211 },
  { name: "gpt-4o-mini", provider: "OpenAI", cents: 22890 },
  { name: "claude-sonnet", provider: "Anthropic", cents: 18446 },
  { name: "embeddings", provider: "OpenAI", cents: 9622 },
  { name: "Other", provider: "", cents: 6231 },
] as const;

const CARD_W = (CONTENT_W - 3 * 24) / 4;
const STATS_TOP = PAD_TOP + 96;
const PANEL_TOP = STATS_TOP + 172;
const CHART_W = 850;
const TABLE_X = CONTENT_X + CHART_W + 32;
const TABLE_W = CONTENT_W - CHART_W - 32;

const OPENAI_SERIES = wave(60, 42, 5, 10, 2.2);
const ANTHROPIC_SERIES = wave(60, 20, 3.4, 7, 5.6);

/**
 * Short-form clip of the AI costs page: spend stats count up, the daily API
 * spend chart draws, and the top cost categories fill in.
 */
export const AiCostsClip: React.FC = () => {
  const frame = useCurrentFrame();
  const count = prog(frame, 10, 46);
  const chart = prog(frame, 26, 66);

  return (
    <AppFrame active="AI costs">
      <div style={{ position: "absolute", left: CONTENT_X, top: PAD_TOP, ...enter(frame, 0) }}>
        <div style={{ fontFamily: FONT.sans, fontSize: 42, fontWeight: 600, letterSpacing: "-0.02em", color: C.ink }}>
          AI costs
        </div>
        <div style={{ marginTop: 6, fontFamily: FONT.sans, fontSize: 16, color: C.inkFaint }}>
          Last synced 39 min ago
        </div>
      </div>

      {/* Stat cards */}
      {STATS.map((s, i) => (
        <div
          key={s.label}
          style={{
            position: "absolute",
            left: CONTENT_X + i * (CARD_W + 24),
            top: STATS_TOP,
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
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {s.label}
          </div>
          <div
            style={{
              marginTop: 12,
              fontFamily: FONT.sans,
              fontSize: 38,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums",
              color: C.ink,
              whiteSpace: "nowrap",
            }}
          >
            {usd(Math.round(s.cents * count))}
          </div>
          <div style={{ marginTop: 8, fontFamily: FONT.sans, fontSize: 14, color: C.inkFaint }}>
            {s.sub}
          </div>
        </div>
      ))}

      {/* Daily API spend chart */}
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
          title="Daily API spend (60 days)"
          headerRight={
            <span style={{ fontFamily: FONT.sans, fontSize: 15, color: C.inkFaint }}>
              Latest: OpenAI <span style={{ color: C.ink, fontWeight: 500 }}>$42,10</span> · Anthropic{" "}
              <span style={{ color: C.ink, fontWeight: 500 }}>$18,73</span>
            </span>
          }
        >
          <div style={{ padding: `26px ${CARD_PAD_X}px 8px` }}>
            <LineChart
              width={CHART_W - CARD_PAD_X * 2}
              height={290}
              progress={chart}
              series={[
                { points: OPENAI_SERIES, color: C.inkSoft, width: 3 },
                { points: ANTHROPIC_SERIES, color: C.brand, width: 3 },
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
              <span>13 Apr</span>
              <span>11 Jun</span>
            </div>
            <div style={{ display: "flex", gap: 26, marginTop: 12, paddingBottom: 8 }}>
              {[
                { label: "OpenAI", color: C.inkSoft },
                { label: "Anthropic", color: C.brand },
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

      {/* Top cost categories */}
      <div
        style={{
          position: "absolute",
          left: TABLE_X,
          top: PANEL_TOP,
          width: TABLE_W,
          ...enter(frame, 24),
        }}
      >
        <Card title="Top cost categories">
          <div
            style={{
              display: "flex",
              padding: `12px ${CARD_PAD_X}px 8px`,
              fontFamily: FONT.sans,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: C.inkFaint,
            }}
          >
            <span style={{ flex: 1 }}>Category</span>
            <span style={{ width: 130 }}>Provider</span>
            <span style={{ width: 120, textAlign: "right" }}>Last 30 days</span>
          </div>
          {CATEGORIES.map((cat, i) => (
            <div
              key={cat.name}
              style={{
                display: "flex",
                alignItems: "center",
                padding: `13px ${CARD_PAD_X}px`,
                borderTop: `1px solid ${C.line}`,
                ...enter(frame, 40 + i * 6, 14, 10),
              }}
            >
              <span style={{ flex: 1, fontFamily: FONT.mono, fontSize: 15.5, color: C.ink }}>
                {cat.name}
              </span>
              <span style={{ width: 130, fontFamily: FONT.sans, fontSize: 15, color: C.inkSoft }}>
                {cat.provider}
              </span>
              <span
                style={{
                  width: 120,
                  textAlign: "right",
                  fontFamily: FONT.mono,
                  fontSize: 15,
                  color: C.ink,
                }}
              >
                {usd(cat.cents)}
              </span>
            </div>
          ))}
          <div
            style={{
              padding: `14px ${CARD_PAD_X}px 6px`,
              borderTop: `1px solid ${C.line}`,
              fontFamily: FONT.sans,
              fontSize: 13.5,
              color: C.inkFaint,
              lineHeight: 1.5,
              ...enter(frame, 80),
            }}
          >
            Billed by the providers in USD. Shown as billed, never converted to
            your workspace currency.
          </div>
        </Card>
      </div>
    </AppFrame>
  );
};
