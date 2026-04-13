export interface User {
	id: number;
	login: string;
	nicename: string;
	email: string;
	url: string;
	registered: string;
	displayName: string;
}

export interface Post {
	id: number;
	postAuthor: number;
	postTitle: string;
	postContent: string;
	postExcerpt: string;
	postStatus: string;
	postType: string;
	postName: string;
	postDate: string;
	postModified: string;
	commentStatus: string;
	commentCount: number;
}

export interface PostsResponse {
	posts: Post[];
	total: number;
	totalPages: number;
	page: number;
	perPage: number;
}

export interface LoginResponse {
	token: string;
	user: {
		id: number;
		login: string;
		email: string;
		displayName: string;
	};
	expiresAt: string;
}

export interface Term {
	termId: number;
	name: string;
	slug: string;
	taxonomy: string;
	description: string;
	parent: number;
	count: number;
}

export interface Settings {
	blogname: string;
	blogdescription: string;
	siteurl: string;
	home: string;
	posts_per_page: number;
	date_format: string;
	time_format: string;
	permalink_structure: string;
}
