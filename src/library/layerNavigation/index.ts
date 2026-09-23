import { createLayerNavigation } from "./navigator";

export {
  LayerNavigationHttpError,
  LayerNavigationProtocolError,
} from "./navigator";
export type {
  LayerNavigation,
  LayerNavigationAskOptions,
  LayerNavigationErrorDetail,
  LayerNavigationOptions,
  LayerNavigationRedirectMode,
  LayerNavigationRenderContext,
  LayerNavigationRequestContext,
  LayerNavigationResultContext,
  LayerNavigationResultDetail,
} from "./types";

export const layerNavigation = createLayerNavigation();

/**
 * Opt in to declarative enhancement of semantic
 * `a[data-mr-layer-navigation][href]` links within a root.
 *
 * This is intentionally not part of the default behaviors bundle.
 */
export function initLayerNavigation(root?: ParentNode): void {
  layerNavigation.initialize(root);
}
