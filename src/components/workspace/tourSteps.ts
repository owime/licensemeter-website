import type { useTranslations } from "next-intl";

export type TourStep = {
  anchor: string;
  title: string;
  body: string;
  placement?: "top" | "bottom" | "left" | "right";
};

/** Translator scoped to the "tour" namespace (from useTranslations("tour")
 * or getTranslations("tour")), passed in by the caller so step titles/bodies
 * are localized. */
type TourTranslator = ReturnType<typeof useTranslations<"tour">>;

export const getWelcomeTourSteps = (t: TourTranslator): TourStep[] => [
  {
    anchor: "connect-cta",
    title: t("welcome.title"),
    body: t("welcome.body"),
    placement: "bottom",
  },
];

export const getDataTourSteps = (t: TourTranslator): TourStep[] => [
  {
    anchor: "waste-card",
    title: t("data.waste.title"),
    body: t("data.waste.body"),
    placement: "bottom",
  },
  {
    anchor: "trend",
    title: t("data.trend.title"),
    body: t("data.trend.body"),
    placement: "top",
  },
  {
    anchor: "nav-findings",
    title: t("data.findings.title"),
    body: t("data.findings.body"),
    placement: "right",
  },
  {
    anchor: "nav-connectors",
    title: t("data.connectors.title"),
    body: t("data.connectors.body"),
    placement: "right",
  },
  {
    anchor: "metric-info",
    title: t("data.metricInfo.title"),
    body: t("data.metricInfo.body"),
    placement: "bottom",
  },
];
