export type FrameVar = {
	name: string;
	type: string;
	value: string;
};

export type Frame = {
	id: string;
	file: string;
	line: number;
	fn: string;
	locals: FrameVar[];
};

export type SnapshotEvent = 'launch' | 'breakpoint' | 'inject' | 'fix';

export type DebugSnapshot = {
	timestamp: string;
	event: SnapshotEvent;
	message: string;
	frames: Frame[];
	activeFrameId: string | null;
};

export type PromptPayload = {
	failure: {
		file: string;
		line: number;
		message: string;
	};
	frames: Frame[];
	constraints: string[];
	repoContext?: {
		files: { path: string; digest: string }[];
	};
};

export type PatchSuggestion = {
	diff: string;
	rationale: string[];
};
