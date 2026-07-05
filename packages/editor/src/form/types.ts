/**
 * Form Builder — 17 field types, validation, submissions, post-submit actions.
 */

export type FormFieldType =
	| 'text'
	| 'email'
	| 'textarea'
	| 'url'
	| 'tel'
	| 'number'
	| 'date'
	| 'time'
	| 'select'
	| 'radio'
	| 'checkbox'
	| 'toggle'
	| 'file'
	| 'acceptance'
	| 'hidden'
	| 'html'
	| 'password';

export interface FormField {
	id: string;
	type: FormFieldType;
	label: string;
	placeholder?: string;
	required: boolean;
	width: 50 | 100;
	/** For select/radio/checkbox: options */
	options?: { value: string; label: string }[];
	/** Validation */
	minLength?: number;
	maxLength?: number;
	min?: number;
	max?: number;
	pattern?: string;
	/** For file: accepted types and max size */
	acceptedTypes?: string;
	maxFileSize?: number;
	/** For hidden: preset value */
	defaultValue?: string;
	/** For acceptance: terms text with link */
	termsText?: string;
}

export type SpamProtection = 'none' | 'honeypot' | 'recaptcha-v2' | 'recaptcha-v3';

export type PostSubmitActionType =
	| 'email'
	| 'email-confirm'
	| 'redirect'
	| 'webhook'
	| 'database'
	| 'mailchimp'
	| 'slack';

export interface PostSubmitAction {
	type: PostSubmitActionType;
	config: Record<string, unknown>;
}

export interface FormConfig {
	fields: FormField[];
	submitButtonText: string;
	submitButtonAlign: 'left' | 'center' | 'right' | 'stretch';
	successMessage: string;
	spamProtection: SpamProtection;
	actions: PostSubmitAction[];
	/** Store submissions in database */
	storeSubmissions: boolean;
}

export const DEFAULT_FORM_CONFIG: FormConfig = {
	fields: [
		{
			id: 'name',
			type: 'text',
			label: 'Name',
			placeholder: 'Your name',
			required: true,
			width: 100,
		},
		{
			id: 'email',
			type: 'email',
			label: 'Email',
			placeholder: 'your@email.com',
			required: true,
			width: 100,
		},
		{
			id: 'message',
			type: 'textarea',
			label: 'Message',
			placeholder: 'Your message...',
			required: false,
			width: 100,
		},
	],
	submitButtonText: 'Send Message',
	submitButtonAlign: 'left',
	successMessage: 'Thank you! Your message has been sent.',
	spamProtection: 'honeypot',
	actions: [{ type: 'email', config: { to: '', subject: 'New form submission' } }],
	storeSubmissions: true,
};
