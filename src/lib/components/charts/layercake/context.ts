import { getContext } from 'svelte';
import type { Readable } from 'svelte/store';

/** A d3 scale as exposed by LayerCake: callable, plus the bits our axes need. */
type Scale = Readable<{
	(value: unknown): number;
	ticks?: (count: number) => unknown[];
	domain?: () => unknown[];
	bandwidth?: () => number;
}>;

/**
 * The subset of the `LayerCake` context our chart layers read.
 * `T` is the datum shape — `{ date, value }` for time series, `{ label, value }` for categories.
 */
export interface LayerCakeContext<T> {
	data: Readable<T[]>;
	xGet: Readable<(d: T) => number>;
	yGet: Readable<(d: T) => number>;
	xScale: Scale;
	yScale: Scale;
	width: Readable<number>;
	height: Readable<number>;
}

export function layerCake<T>(): LayerCakeContext<T> {
	return getContext('LayerCake') as LayerCakeContext<T>;
}
