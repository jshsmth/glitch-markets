export function createAbortController(): {
	controller: AbortController | null;
	abort: () => void;
	reset: () => AbortController;
	getSignal: () => AbortSignal | undefined;
} {
	let controller: AbortController | null = null;

	return {
		get controller() {
			return controller;
		},
		set controller(value: AbortController | null) {
			controller = value;
		},

		abort() {
			if (controller) {
				controller.abort();
				controller = null;
			}
		},

		reset() {
			if (controller) {
				controller.abort();
			}
			controller = new AbortController();
			return controller;
		},

		getSignal() {
			return controller?.signal;
		}
	};
}

export function createIntervalManager(): {
	intervalId: ReturnType<typeof setInterval> | null;
	start: (callback: () => void, ms: number) => void;
	stop: () => void;
	isRunning: () => boolean;
} {
	let intervalId: ReturnType<typeof setInterval> | null = null;

	return {
		get intervalId() {
			return intervalId;
		},
		set intervalId(value: ReturnType<typeof setInterval> | null) {
			intervalId = value;
		},

		start(callback: () => void, ms: number) {
			this.stop();
			intervalId = setInterval(callback, ms);
		},

		stop() {
			if (intervalId) {
				clearInterval(intervalId);
				intervalId = null;
			}
		},

		isRunning() {
			return intervalId !== null;
		}
	};
}

export class CleanupManager {
	private abortController: AbortController | null = null;
	private intervals: Set<ReturnType<typeof setInterval>> = new Set();
	private timeouts: Set<ReturnType<typeof setTimeout>> = new Set();
	private cleanupCallbacks: Set<() => void> = new Set();

	getAbortController(): AbortController {
		if (this.abortController) {
			this.abortController.abort();
		}
		this.abortController = new AbortController();
		return this.abortController;
	}

	getSignal(): AbortSignal | undefined {
		return this.abortController?.signal;
	}

	setInterval(callback: () => void, ms: number): ReturnType<typeof setInterval> {
		const id = setInterval(callback, ms);
		this.intervals.add(id);
		return id;
	}

	setTimeout(callback: () => void, ms: number): ReturnType<typeof setTimeout> {
		const id = setTimeout(callback, ms);
		this.timeouts.add(id);
		return id;
	}

	clearInterval(id: ReturnType<typeof setInterval>): void {
		clearInterval(id);
		this.intervals.delete(id);
	}

	clearTimeout(id: ReturnType<typeof setTimeout>): void {
		clearTimeout(id);
		this.timeouts.delete(id);
	}

	addCleanup(callback: () => void): void {
		this.cleanupCallbacks.add(callback);
	}

	removeCleanup(callback: () => void): void {
		this.cleanupCallbacks.delete(callback);
	}

	cleanup(): void {
		if (this.abortController) {
			this.abortController.abort();
			this.abortController = null;
		}

		this.intervals.forEach((id) => clearInterval(id));
		this.intervals.clear();

		this.timeouts.forEach((id) => clearTimeout(id));
		this.timeouts.clear();

		this.cleanupCallbacks.forEach((callback) => {
			try {
				callback();
			} catch (error) {
				console.error('Error in cleanup callback:', error);
			}
		});
		this.cleanupCallbacks.clear();
	}
}
