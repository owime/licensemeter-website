import React from "react";
import { Composition } from "remotion";
import "./lib/fonts";
import { ConnectorsClip } from "./scenes/ConnectorsClip";
import { OverviewClip } from "./scenes/OverviewClip";
import { FindingsClip } from "./scenes/FindingsClip";
import { AiCostsClip } from "./scenes/AiCostsClip";

const FPS = 30;

/* Short-form feature clips for the landing page showcase: no intro/outro,
 * action starts immediately, each ends on a settled state. 10-12s each. */
const CONNECTORS_LEN = 320;
const OVERVIEW_LEN = 310;
const FINDINGS_LEN = 330;
const AI_COSTS_LEN = 310;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="FeatureOverview"
      component={OverviewClip}
      durationInFrames={OVERVIEW_LEN}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Composition
      id="FeatureFindings"
      component={FindingsClip}
      durationInFrames={FINDINGS_LEN}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Composition
      id="FeatureAiCosts"
      component={AiCostsClip}
      durationInFrames={AI_COSTS_LEN}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Composition
      id="FeatureConnectors"
      component={ConnectorsClip}
      durationInFrames={CONNECTORS_LEN}
      fps={FPS}
      width={1920}
      height={1080}
      calculateMetadata={() => ({ props: { len: CONNECTORS_LEN } })}
      defaultProps={{ len: CONNECTORS_LEN }}
    />
  </>
);
