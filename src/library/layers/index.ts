import { NativeLayerManager } from "./manager";

export type {
  Layer,
  LayerCloseOptions,
  LayerLifecycleEventDetail,
  LayerOutcome,
  LayerResultEventDetail,
  LayerManager,
  LayerMode,
  LayerOpenOptions,
  LayerState,
} from "./types";

export const layers = new NativeLayerManager();

/** Register declarative data-mr-layer surfaces within a root. Safe to call repeatedly. */
export function initLayers(root?: ParentNode): void {
  layers.initialize(root);
}
