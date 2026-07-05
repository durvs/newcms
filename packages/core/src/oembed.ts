/**
 * oEmbed provider registry and URL matching.
 * Matches URLs to known providers and generates embed HTML.
 */

export interface OEmbedProvider {
	name: string;
	/** URL patterns that this provider handles (regex strings) */
	patterns: string[];
	/** oEmbed API endpoint URL */
	endpoint: string;
	/** Default embed format */
	format?: 'json' | 'xml';
}

/**
 * Built-in oEmbed providers.
 */
export const OEMBED_PROVIDERS: OEmbedProvider[] = [
	{
		name: 'YouTube',
		patterns: ['https?://(?:www\\.)?youtube\\.com/watch.*', 'https?://youtu\\.be/.*'],
		endpoint: 'https://www.youtube.com/oembed',
	},
	{
		name: 'Vimeo',
		patterns: ['https?://(?:www\\.)?vimeo\\.com/.*'],
		endpoint: 'https://vimeo.com/api/oembed.json',
	},
	{
		name: 'Twitter/X',
		patterns: ['https?://(?:www\\.)?(?:twitter|x)\\.com/.*/status/.*'],
		endpoint: 'https://publish.twitter.com/oembed',
	},
	{
		name: 'Instagram',
		patterns: [
			'https?://(?:www\\.)?instagram\\.com/p/.*',
			'https?://(?:www\\.)?instagram\\.com/reel/.*',
		],
		endpoint: 'https://graph.facebook.com/v18.0/instagram_oembed',
	},
	{
		name: 'Spotify',
		patterns: ['https?://open\\.spotify\\.com/.*'],
		endpoint: 'https://open.spotify.com/oembed',
	},
	{
		name: 'SoundCloud',
		patterns: ['https?://soundcloud\\.com/.*'],
		endpoint: 'https://soundcloud.com/oembed',
	},
	{
		name: 'TikTok',
		patterns: ['https?://(?:www\\.)?tiktok\\.com/.*/video/.*'],
		endpoint: 'https://www.tiktok.com/oembed',
	},
	{
		name: 'Reddit',
		patterns: ['https?://(?:www\\.)?reddit\\.com/r/.*/comments/.*'],
		endpoint: 'https://www.reddit.com/oembed',
	},
	{
		name: 'Imgur',
		patterns: ['https?://(?:i\\.)?imgur\\.com/.*'],
		endpoint: 'https://api.imgur.com/oembed',
	},
	{
		name: 'Flickr',
		patterns: ['https?://(?:www\\.)?flickr\\.com/photos/.*'],
		endpoint: 'https://www.flickr.com/services/oembed/',
	},
	{
		name: 'Dailymotion',
		patterns: ['https?://(?:www\\.)?dailymotion\\.com/video/.*'],
		endpoint: 'https://www.dailymotion.com/services/oembed',
	},
	{
		name: 'WordPress.tv',
		patterns: ['https?://wordpress\\.tv/.*'],
		endpoint: 'https://wordpress.tv/oembed/',
	},
	{
		name: 'Tumblr',
		patterns: ['https?://.*\\.tumblr\\.com/post/.*'],
		endpoint: 'https://www.tumblr.com/oembed/1.0',
	},
	{
		name: 'Kickstarter',
		patterns: ['https?://(?:www\\.)?kickstarter\\.com/projects/.*'],
		endpoint: 'https://www.kickstarter.com/services/oembed',
	},
	{
		name: 'CodePen',
		patterns: ['https?://codepen\\.io/.*/pen/.*'],
		endpoint: 'https://codepen.io/api/oembed',
	},
	{
		name: 'SlideShare',
		patterns: ['https?://(?:www\\.)?slideshare\\.net/.*'],
		endpoint: 'https://www.slideshare.net/api/oembed/2',
	},
	{
		name: 'Loom',
		patterns: ['https?://(?:www\\.)?loom\\.com/share/.*'],
		endpoint: 'https://www.loom.com/v1/oembed',
	},
	{
		name: 'Figma',
		patterns: ['https?://(?:www\\.)?figma\\.com/(?:file|proto)/.*'],
		endpoint: 'https://www.figma.com/api/oembed',
	},
];

/**
 * Find the oEmbed provider for a URL.
 */
export function findProvider(url: string): OEmbedProvider | undefined {
	for (const provider of OEMBED_PROVIDERS) {
		for (const pattern of provider.patterns) {
			if (new RegExp(pattern, 'i').test(url)) {
				return provider;
			}
		}
	}
	return undefined;
}

/**
 * Build the oEmbed API request URL.
 */
export function buildOEmbedUrl(
	provider: OEmbedProvider,
	contentUrl: string,
	options?: { maxWidth?: number; maxHeight?: number },
): string {
	const parts = [`url=${encodeURIComponent(contentUrl)}`, `format=${provider.format ?? 'json'}`];
	if (options?.maxWidth) parts.push(`maxwidth=${options.maxWidth}`);
	if (options?.maxHeight) parts.push(`maxheight=${options.maxHeight}`);

	return `${provider.endpoint}?${parts.join('&')}`;
}
