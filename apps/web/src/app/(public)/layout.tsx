import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'NewCMS Site',
};

/**
 * Public layout — clean, no admin chrome.
 * In the future this will load header/footer templates from the theme builder.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
	return (
		<div style={{ minHeight: '100vh', fontFamily: 'var(--e-global-typography-primary-font-family, system-ui, sans-serif)' }}>
			{/* Header — will be replaced by theme builder header template */}
			<header style={{
				padding: '16px 24px',
				borderBottom: '1px solid #e5e7eb',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				maxWidth: 1200,
				margin: '0 auto',
			}}>
				<a href="/" style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', textDecoration: 'none' }}>
					NewCMS
				</a>
				<nav style={{ display: 'flex', gap: 24 }}>
					{['Home', 'About', 'Blog', 'Contact'].map((item) => (
						<a key={item} href={`/${item.toLowerCase()}`} style={{ color: '#64748b', textDecoration: 'none', fontSize: 14 }}>
							{item}
						</a>
					))}
				</nav>
			</header>

			{/* Content */}
			<main>
				{children}
			</main>

			{/* Footer */}
			<footer style={{
				padding: '32px 24px',
				borderTop: '1px solid #e5e7eb',
				textAlign: 'center',
				color: '#94a3b8',
				fontSize: 13,
				marginTop: 48,
			}}>
				Powered by NewCMS
			</footer>
		</div>
	);
}
