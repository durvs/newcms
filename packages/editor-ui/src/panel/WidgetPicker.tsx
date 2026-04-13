import { useState, type DragEvent } from 'react';
import {
	Search, Box, Image, Minus, Square, Code2, List, Quote, ChevronsUpDown,
	AlignLeft, Heading, Video, LayoutGrid, GalleryHorizontal, MessageSquareQuote,
	Star, SlidersHorizontal, Sparkles, CircleDot, Navigation, Menu, Search as SearchIcon,
	ListOrdered, MapPin, Volume2, Play, Lightbulb, MousePointer, FlipHorizontal,
	Timer, BarChart3, AlertTriangle, Link, Columns3, ToggleLeft, PanelRight,
	Users, Share2, FileCode, Anchor, Table, ShoppingCart, CreditCard, FormInput,
	Hash, Layers, Award,
} from 'lucide-react';
import { useEditorStore } from '../store/editor-store';

interface WidgetDef {
	type: string;
	label: string;
	icon: typeof Heading;
	category: string;
}

const WIDGETS: WidgetDef[] = [
	// 13.1 Text & Typography
	{ type: 'heading', label: 'Heading', icon: Heading, category: 'text' },
	{ type: 'paragraph', label: 'Text Editor', icon: AlignLeft, category: 'text' },
	{ type: 'heading-animated', label: 'Animated Heading', icon: Sparkles, category: 'text' },
	{ type: 'quote', label: 'Blockquote', icon: Quote, category: 'text' },
	{ type: 'code', label: 'Code Highlight', icon: Code2, category: 'text' },
	{ type: 'list', label: 'List', icon: List, category: 'text' },

	// 13.2 Media
	{ type: 'image', label: 'Image', icon: Image, category: 'media' },
	{ type: 'video', label: 'Video', icon: Video, category: 'media' },
	{ type: 'gallery', label: 'Gallery', icon: GalleryHorizontal, category: 'media' },
	{ type: 'carousel', label: 'Carousel', icon: SlidersHorizontal, category: 'media' },
	{ type: 'testimonial', label: 'Testimonials', icon: MessageSquareQuote, category: 'media' },
	{ type: 'slides', label: 'Slides', icon: Layers, category: 'media' },
	{ type: 'lottie', label: 'Lottie', icon: Play, category: 'media' },
	{ type: 'hotspot', label: 'Hotspot', icon: CircleDot, category: 'media' },
	{ type: 'map', label: 'Map', icon: MapPin, category: 'media' },
	{ type: 'audio', label: 'Audio', icon: Volume2, category: 'media' },

	// 13.3 Interactive & Layout
	{ type: 'button', label: 'Button', icon: Square, category: 'interactive' },
	{ type: 'tabs', label: 'Tabs', icon: Columns3, category: 'interactive' },
	{ type: 'accordion', label: 'Accordion', icon: ListOrdered, category: 'interactive' },
	{ type: 'toggle', label: 'Toggle', icon: ToggleLeft, category: 'interactive' },
	{ type: 'separator', label: 'Divider', icon: Minus, category: 'interactive' },
	{ type: 'spacer', label: 'Spacer', icon: ChevronsUpDown, category: 'interactive' },
	{ type: 'html', label: 'Custom HTML', icon: FileCode, category: 'interactive' },
	{ type: 'shortcode', label: 'Shortcode', icon: Code2, category: 'interactive' },
	{ type: 'icon', label: 'Icon', icon: Award, category: 'interactive' },
	{ type: 'icon-box', label: 'Icon Box', icon: Lightbulb, category: 'interactive' },
	{ type: 'icon-list', label: 'Icon List', icon: List, category: 'interactive' },
	{ type: 'off-canvas', label: 'Off-Canvas', icon: PanelRight, category: 'interactive' },
	{ type: 'social-icons', label: 'Social Icons', icon: Users, category: 'interactive' },
	{ type: 'rating', label: 'Rating', icon: Star, category: 'interactive' },
	{ type: 'counter', label: 'Counter', icon: Hash, category: 'interactive' },
	{ type: 'progress-bar', label: 'Progress Bar', icon: BarChart3, category: 'interactive' },
	{ type: 'alert', label: 'Alert', icon: AlertTriangle, category: 'interactive' },
	{ type: 'anchor', label: 'Menu Anchor', icon: Anchor, category: 'interactive' },

	// 13.4 Marketing & Conversion
	{ type: 'pricing-table', label: 'Pricing Table', icon: Table, category: 'marketing' },
	{ type: 'price-list', label: 'Price List', icon: List, category: 'marketing' },
	{ type: 'cta', label: 'Call to Action', icon: MousePointer, category: 'marketing' },
	{ type: 'countdown', label: 'Countdown', icon: Timer, category: 'marketing' },
	{ type: 'progress-tracker', label: 'Progress Tracker', icon: Navigation, category: 'marketing' },
	{ type: 'flip-box', label: 'Flip Box', icon: FlipHorizontal, category: 'marketing' },
	{ type: 'link-in-bio', label: 'Link in Bio', icon: Link, category: 'marketing' },

	// 13.5 Navigation
	{ type: 'nav-menu', label: 'Nav Menu', icon: Menu, category: 'navigation' },
	{ type: 'mega-menu', label: 'Mega Menu', icon: LayoutGrid, category: 'navigation' },
	{ type: 'search', label: 'Search', icon: SearchIcon, category: 'navigation' },
	{ type: 'toc', label: 'Table of Contents', icon: ListOrdered, category: 'navigation' },
	{ type: 'breadcrumb', label: 'Breadcrumb', icon: Navigation, category: 'navigation' },

	// 13.6 Social
	{ type: 'share-buttons', label: 'Share Buttons', icon: Share2, category: 'social' },

	// Forms
	{ type: 'form', label: 'Form', icon: FormInput, category: 'forms' },
	{ type: 'login-form', label: 'Login Form', icon: FormInput, category: 'forms' },

	// E-commerce
	{ type: 'product-grid', label: 'Product Grid', icon: ShoppingCart, category: 'commerce' },
	{ type: 'cart', label: 'Cart', icon: ShoppingCart, category: 'commerce' },
	{ type: 'checkout', label: 'Checkout', icon: CreditCard, category: 'commerce' },
];

const CATEGORIES: { id: string; label: string }[] = [
	{ id: 'text', label: 'Text' },
	{ id: 'media', label: 'Media' },
	{ id: 'interactive', label: 'Interactive & Layout' },
	{ id: 'marketing', label: 'Marketing' },
	{ id: 'navigation', label: 'Navigation' },
	{ id: 'social', label: 'Social' },
	{ id: 'forms', label: 'Forms' },
	{ id: 'commerce', label: 'Commerce' },
];

export function WidgetPicker() {
	const [search, setSearch] = useState('');
	const addContainer = useEditorStore((s) => s.addContainer);
	const startDrag = useEditorStore((s) => s.startDrag);

	const filtered = search
		? WIDGETS.filter((w) => w.label.toLowerCase().includes(search.toLowerCase()))
		: WIDGETS;

	function onDragStart(e: DragEvent, type: string) {
		e.dataTransfer.setData('widget-type', type);
		e.dataTransfer.effectAllowed = 'copy';
		startDrag(type);
	}

	return (
		<div style={{ padding: 12 }}>
			<div style={{ position: 'relative', marginBottom: 12 }}>
				<Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--cm-text-faint)' }} />
				<input
					type="text"
					placeholder="Search widgets..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					style={{
						width: '100%', height: 32, borderRadius: 8, boxSizing: 'border-box',
						border: '1px solid var(--cm-border)', background: 'var(--cm-input-bg)',
						paddingLeft: 32, paddingRight: 10, fontSize: 12,
						color: 'var(--cm-text)', outline: 'none',
					}}
				/>
			</div>

			<button
				onClick={() => addContainer(null)}
				draggable
				onDragStart={(e) => { e.dataTransfer.setData('widget-type', '__container'); startDrag('__container'); }}
				style={{
					width: '100%', display: 'flex', alignItems: 'center', gap: 8,
					padding: '8px 12px', borderRadius: 8, marginBottom: 16,
					border: '1.5px dashed var(--cm-border)', background: 'transparent',
					color: 'var(--cm-text-muted)', fontSize: 12, fontWeight: 500,
					cursor: 'grab', boxSizing: 'border-box',
				}}
			>
				<Box size={16} /> Container
			</button>

			{CATEGORIES.map((cat) => {
				const items = filtered.filter((w) => w.category === cat.id);
				if (items.length === 0) return null;
				return (
					<div key={cat.id} style={{ marginBottom: 16 }}>
						<div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cm-text-faint)', marginBottom: 8 }}>
							{cat.label}
						</div>
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
							{items.map((w) => (
								<WidgetCard key={w.type} widget={w} onDragStart={onDragStart} />
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
}

function WidgetCard({ widget, onDragStart }: { widget: WidgetDef; onDragStart: (e: DragEvent, type: string) => void }) {
	const [hover, setHover] = useState(false);
	const addElement = useEditorStore((s) => s.addElement);
	const Icon = widget.icon;

	return (
		<button
			draggable
			onDragStart={(e) => onDragStart(e, widget.type)}
			onClick={() => addElement(widget.type, null)}
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
			style={{
				display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
				padding: '10px 4px', borderRadius: 8, border: 'none',
				background: hover ? 'var(--cm-surface-elevated)' : 'transparent',
				color: hover ? 'var(--color-accent)' : 'var(--cm-text-muted)',
				fontSize: 9, fontWeight: 500, cursor: 'grab',
				transition: 'all .12s',
			}}
		>
			<Icon size={18} strokeWidth={1.5} />
			<span style={{ lineHeight: 1.2, textAlign: 'center' }}>{widget.label}</span>
		</button>
	);
}
