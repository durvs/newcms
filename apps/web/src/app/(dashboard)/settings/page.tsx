'use client';

import { useState, useEffect } from 'react';
import { useSettings, useUpdateSetting } from '@/hooks/use-settings';
import { Save, Check } from 'lucide-react';
import { toast } from 'sonner';

interface SettingField {
	key: string;
	label: string;
	description: string;
	type?: 'text' | 'number';
}

const fields: SettingField[] = [
	{ key: 'blogname', label: 'Site Title', description: 'The name of your site' },
	{ key: 'blogdescription', label: 'Tagline', description: 'A short description of your site' },
	{ key: 'siteurl', label: 'Site URL', description: 'The full URL of your site' },
	{
		key: 'posts_per_page',
		label: 'Posts per Page',
		description: 'Number of posts to show per page',
		type: 'number',
	},
	{ key: 'date_format', label: 'Date Format', description: 'How dates are displayed' },
	{ key: 'time_format', label: 'Time Format', description: 'How times are displayed' },
	{
		key: 'permalink_structure',
		label: 'Permalink Structure',
		description: 'URL structure for posts',
	},
];

export default function SettingsPage() {
	const { data: settings, isLoading } = useSettings();
	const updateMut = useUpdateSetting();
	const [values, setValues] = useState<Record<string, string>>({});
	const [saved, setSaved] = useState<Record<string, boolean>>({});

	useEffect(() => {
		if (settings) {
			const v: Record<string, string> = {};
			for (const f of fields) {
				v[f.key] = String((settings as unknown as Record<string, unknown>)[f.key] ?? '');
			}
			setValues(v);
		}
	}, [settings]);

	function handleSave(key: string) {
		updateMut.mutate(
			{ name: key, value: values[key] },
			{
				onSuccess: () => {
					setSaved((s) => ({ ...s, [key]: true }));
					setTimeout(() => setSaved((s) => ({ ...s, [key]: false })), 2000);
					toast.success(`"${key}" updated`);
				},
				onError: (err) => toast.error(err.message),
			},
		);
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
			</div>
		);
	}

	return (
		<div>
			<div className="mb-6 animate-fade-in-up">
				<p className="text-xs font-medium uppercase tracking-widest text-text-muted font-mono">
					Configuration
				</p>
				<h1 className="mt-1 text-2xl font-bold tracking-tight text-text">Settings</h1>
			</div>

			<div className="space-y-3 animate-fade-in-up-delay-1">
				{fields.map((field) => (
					<div
						key={field.key}
						className="flex flex-col gap-3 rounded-xl border border-border bg-surface-elevated p-5 sm:flex-row sm:items-center sm:justify-between"
					>
						<div className="min-w-0 flex-1">
							<label htmlFor={field.key} className="text-[13px] font-medium text-text">
								{field.label}
							</label>
							<p className="mt-0.5 text-[11px] text-text-muted">{field.description}</p>
						</div>
						<div className="flex items-center gap-2 sm:w-80">
							<input
								id={field.key}
								type={field.type ?? 'text'}
								value={values[field.key] ?? ''}
								onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
								className="h-9 flex-1 rounded-lg border border-border bg-input-bg px-3 text-sm text-text font-mono outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
							/>
							<button
								onClick={() => handleSave(field.key)}
								disabled={updateMut.isPending}
								className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:bg-accent/10 hover:text-accent hover:border-accent/30 disabled:opacity-50"
								title="Save"
							>
								{saved[field.key] ? (
									<Check className="h-4 w-4 text-emerald-400" />
								) : (
									<Save className="h-3.5 w-3.5" />
								)}
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
