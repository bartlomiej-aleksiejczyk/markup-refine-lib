import { NativeTooltipRegistry, DEFAULT_TOOLTIP_OPTIONS } from "./manager";

export type {
  Tooltip,
  TooltipOptions,
  TooltipRegistry,
  TooltipState,
} from "./types";
export { DEFAULT_TOOLTIP_OPTIONS };

export const tooltips = new NativeTooltipRegistry();

/** Register data-mr-tooltip triggers within a root. Safe to call repeatedly. */
export function initTooltips(root?: ParentNode): void {
  tooltips.initialize(root);
}
