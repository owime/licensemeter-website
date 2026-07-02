import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

const fonts = [
  { family: "Geist", url: "fonts/Geist-Regular.woff2", weight: "400" },
  { family: "Geist", url: "fonts/Geist-Medium.woff2", weight: "500" },
  { family: "Geist", url: "fonts/Geist-SemiBold.woff2", weight: "600" },
  { family: "Geist Mono", url: "fonts/GeistMono-Regular.woff2", weight: "400" },
  { family: "Geist Mono", url: "fonts/GeistMono-Medium.woff2", weight: "500" },
];

export const fontsReady = Promise.all(
  fonts.map((f) =>
    loadFont({ family: f.family, url: staticFile(f.url), weight: f.weight }),
  ),
);
