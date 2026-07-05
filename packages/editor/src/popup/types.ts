/**
 * Popup Builder — popups with triggers, conditions, and animations.
 */

export type PopupTrigger =
	| { type: 'on-load'; delay: number }
	| { type: 'on-scroll'; scrollPercent: number }
	| { type: 'on-click'; selector: string }
	| { type: 'exit-intent' }
	| { type: 'inactivity'; timeout: number };

export type PopupAnimation =
	| 'fade'
	| 'slide-up'
	| 'slide-down'
	| 'slide-left'
	| 'slide-right'
	| 'zoom'
	| 'none';

export interface PopupPosition {
	horizontal: 'left' | 'center' | 'right';
	vertical: 'top' | 'center' | 'bottom';
}

export interface PopupFrequency {
	type: 'always' | 'once' | 'session' | 'custom';
	/** For custom: show every N days */
	days?: number;
	/** For custom: max total shows */
	maxShows?: number;
}

export interface PopupConfig {
	triggers: PopupTrigger[];
	animation: PopupAnimation;
	animationDuration: number;
	position: PopupPosition;
	width: string;
	height?: string;
	overlay: boolean;
	overlayColor: string;
	overlayOpacity: number;
	closeButton: boolean;
	closeOnOverlayClick: boolean;
	closeOnEsc: boolean;
	autoClose?: number;
	preventScroll: boolean;
	zIndex: number;
	frequency: PopupFrequency;
	/** Display conditions (same system as theme templates) */
	conditions?: import('../theme/types').TemplateCondition[];
	/** Device targeting */
	devices?: ('desktop' | 'tablet' | 'mobile')[];
	/** Date range */
	startDate?: string;
	endDate?: string;
}

export const DEFAULT_POPUP_CONFIG: PopupConfig = {
	triggers: [{ type: 'on-load', delay: 0 }],
	animation: 'fade',
	animationDuration: 300,
	position: { horizontal: 'center', vertical: 'center' },
	width: '600px',
	overlay: true,
	overlayColor: '#000000',
	overlayOpacity: 0.5,
	closeButton: true,
	closeOnOverlayClick: true,
	closeOnEsc: true,
	preventScroll: true,
	zIndex: 9999,
	frequency: { type: 'always' },
};
