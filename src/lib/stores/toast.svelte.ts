export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
	id: number;
	message: string;
	type: ToastType;
	duration: number;
}

let nextId = 0;
let toasts = $state<Toast[]>([]);

export function getToasts(): Toast[] {
	return toasts;
}

export function addToast(message: string, type: ToastType = 'info', duration = 3000): number {
	const id = nextId++;
	toasts.push({ id, message, type, duration });

	if (duration > 0) {
		setTimeout(() => removeToast(id), duration);
	}

	return id;
}

export function removeToast(id: number): void {
	toasts = toasts.filter((t) => t.id !== id);
}

export const toast = {
	success: (message: string, duration = 3000) => addToast(message, 'success', duration),
	error: (message: string, duration = 5000) => addToast(message, 'error', duration),
	info: (message: string, duration = 3000) => addToast(message, 'info', duration)
};
