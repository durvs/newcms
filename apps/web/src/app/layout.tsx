import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
	title: 'NewCMS',
	description: 'Content Management System',
};

// Static inline script — no user input, prevents theme flash on load.
// Runs before React hydration to set data-theme from localStorage.
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('newcms_theme');if(!t)t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				{/* nosemgrep: react-dangerouslysetinnerhtml — static string, no user input */}
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
			</head>
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
