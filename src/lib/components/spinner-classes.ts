export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<SpinnerSize, string> = {
	sm: 'h-5 w-5',
	md: 'h-6 w-6',
	lg: 'h-8 w-8',
	xl: 'h-12 w-12'
};

/**
 * Build the class string for a loading spinner: size + the shared animation classes,
 * with optional border/color classes appended by the caller.
 */
export function spinnerClasses(size: SpinnerSize, extra = ''): string {
	const base = `${SIZE_CLASSES[size]} animate-spin rounded-full`;
	return extra ? `${base} ${extra}` : base;
}
