import type { Detector } from "./base";
import { configDetector } from "./config";
import { customTermDetector } from "./custom";
import { internalDetector } from "./internal";
import { piiDetector } from "./pii";
import { secretDetector } from "./secrets";

export const defaultDetectors: Detector[] = [secretDetector, piiDetector, internalDetector, configDetector, customTermDetector];
