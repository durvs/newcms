/**
 * Motion effects — scroll, mouse, and entrance animations.
 * Stored in element settings under _motion key.
 */

export interface MotionEffects {
	entrance?: EntranceAnimation;
	scroll?: ScrollEffect[];
	mouse?: MouseEffect[];
}

export interface EntranceAnimation {
	type:
		| 'fade-in'
		| 'fade-in-up'
		| 'fade-in-down'
		| 'fade-in-left'
		| 'fade-in-right'
		| 'zoom-in'
		| 'zoom-out'
		| 'slide-in-up'
		| 'slide-in-down'
		| 'slide-in-left'
		| 'slide-in-right'
		| 'bounce-in'
		| 'rotate-in'
		| 'roll-in'
		| 'light-speed-in'
		| 'none';
	duration: 'slow' | 'normal' | 'fast';
	delay: number; // ms
}

export interface ScrollEffect {
	type: 'translateX' | 'translateY' | 'opacity' | 'blur' | 'rotate' | 'scale';
	direction?: 'up' | 'down' | 'left' | 'right';
	speed: number; // 1-10
	viewport: { start: number; end: number }; // percentage 0-100
}

export interface MouseEffect {
	type: 'tilt' | 'follow' | 'parallax';
	sensitivity: number; // 1-10
}

export const ENTRANCE_ANIMATIONS: { value: EntranceAnimation['type']; label: string }[] = [
	{ value: 'none', label: 'None' },
	{ value: 'fade-in', label: 'Fade In' },
	{ value: 'fade-in-up', label: 'Fade In Up' },
	{ value: 'fade-in-down', label: 'Fade In Down' },
	{ value: 'fade-in-left', label: 'Fade In Left' },
	{ value: 'fade-in-right', label: 'Fade In Right' },
	{ value: 'zoom-in', label: 'Zoom In' },
	{ value: 'zoom-out', label: 'Zoom Out' },
	{ value: 'slide-in-up', label: 'Slide In Up' },
	{ value: 'slide-in-down', label: 'Slide In Down' },
	{ value: 'bounce-in', label: 'Bounce In' },
	{ value: 'rotate-in', label: 'Rotate In' },
];

/**
 * Generate CSS keyframes and animation property for an entrance animation.
 */
export function entranceToCSS(anim: EntranceAnimation, elementId: string): string {
	if (anim.type === 'none') return '';

	const dur = anim.duration === 'slow' ? '1s' : anim.duration === 'fast' ? '0.3s' : '0.6s';
	const delay = anim.delay > 0 ? `${anim.delay}ms` : '0s';

	const keyframes: Record<string, string> = {
		'fade-in': 'from{opacity:0}to{opacity:1}',
		'fade-in-up': 'from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}',
		'fade-in-down':
			'from{opacity:0;transform:translateY(-30px)}to{opacity:1;transform:translateY(0)}',
		'fade-in-left':
			'from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}',
		'fade-in-right':
			'from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}',
		'zoom-in': 'from{opacity:0;transform:scale(0.6)}to{opacity:1;transform:scale(1)}',
		'zoom-out': 'from{opacity:0;transform:scale(1.2)}to{opacity:1;transform:scale(1)}',
		'slide-in-up': 'from{transform:translateY(100%)}to{transform:translateY(0)}',
		'slide-in-down': 'from{transform:translateY(-100%)}to{transform:translateY(0)}',
		'slide-in-left': 'from{transform:translateX(-100%)}to{transform:translateX(0)}',
		'slide-in-right': 'from{transform:translateX(100%)}to{transform:translateX(0)}',
		'bounce-in':
			'from{opacity:0;transform:scale(0.3)}50%{transform:scale(1.05)}70%{transform:scale(0.9)}to{opacity:1;transform:scale(1)}',
		'rotate-in': 'from{opacity:0;transform:rotate(-200deg)}to{opacity:1;transform:rotate(0)}',
	};

	const kf = keyframes[anim.type] ?? '';
	if (!kf) return '';

	const name = `builder-entrance-${elementId}`;
	return `@keyframes ${name}{${kf}}\n.builder-el-${elementId}{animation:${name} ${dur} ${delay} ease-out both;}`;
}
