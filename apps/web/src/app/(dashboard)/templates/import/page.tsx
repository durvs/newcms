'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileArchive, Check, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getToken } from '@/lib/api';
import { toast } from 'sonner';

interface ImportResult {
	success: boolean;
	kit: { name: string; version: string; templateCount?: number };
	imported: { id: number; title: string; type: string; postType: string }[];
	errors?: string[];
}

export default function ImportTemplatePage() {
	const router = useRouter();
	const fileRef = useRef<HTMLInputElement>(null);
	const [file, setFile] = useState<File | null>(null);
	const [importing, setImporting] = useState(false);
	const [result, setResult] = useState<ImportResult | null>(null);
	const [error, setError] = useState('');
	const [dragOver, setDragOver] = useState(false);

	function handleFile(f: File) {
		if (!f.name.endsWith('.zip')) {
			setError('Please select a ZIP file');
			return;
		}
		setFile(f);
		setError('');
		setResult(null);
	}

	async function handleImport() {
		if (!file) return;
		setImporting(true);
		setError('');

		try {
			const formData = new FormData();
			formData.append('file', file);

			const token = getToken();
			const res = await fetch('/api/v2/templates/import', {
				method: 'POST',
				headers: token ? { Authorization: `Bearer ${token}` } : {},
				body: formData,
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.message ?? `Import failed (${res.status})`);
			}

			const data: ImportResult = await res.json();
			setResult(data);
			toast.success(`Kit "${data.kit.name}" imported successfully`);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Import failed');
			toast.error('Import failed');
		} finally {
			setImporting(false);
		}
	}

	return (
		<div>
			<div className="mb-6 flex items-center gap-3 animate-fade-in-up">
				<Link href="/templates" className="rounded-lg p-2 text-text-muted hover:bg-surface-elevated hover:text-text transition-colors">
					<ArrowLeft className="h-4 w-4" />
				</Link>
				<div>
					<p className="text-xs font-medium uppercase tracking-widest text-text-muted font-mono">Theme Builder</p>
					<h1 className="mt-0.5 text-xl font-bold tracking-tight text-text">Import Template Kit</h1>
				</div>
			</div>

			<div className="max-w-xl animate-fade-in-up-delay-1">
				{/* Drop zone */}
				{!result && (
					<div
						onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
						onDragLeave={() => setDragOver(false)}
						onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
						onClick={() => fileRef.current?.click()}
						className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all ${
							dragOver ? 'border-accent bg-accent/5' : file ? 'border-accent/40 bg-surface-elevated' : 'border-border hover:border-text-faint'
						}`}
					>
						<input
							ref={fileRef}
							type="file"
							accept=".zip"
							className="hidden"
							onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
						/>

						{file ? (
							<div className="flex flex-col items-center gap-3">
								<FileArchive className="h-10 w-10 text-accent" />
								<div>
									<p className="text-sm font-semibold text-text">{file.name}</p>
									<p className="text-xs text-text-muted mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
								</div>
								<p className="text-xs text-text-faint">Click to change file</p>
							</div>
						) : (
							<div className="flex flex-col items-center gap-3">
								<Upload className="h-10 w-10 text-text-faint" />
								<div>
									<p className="text-sm font-semibold text-text">Drop your template kit here</p>
									<p className="text-xs text-text-muted mt-1">or click to browse — accepts .zip files</p>
								</div>
							</div>
						)}
					</div>
				)}

				{/* Error */}
				{error && (
					<div className="mt-4 flex items-center gap-2 rounded-lg bg-error-soft/10 px-4 py-3 text-sm text-error-soft ring-1 ring-error-soft/20">
						<AlertTriangle className="h-4 w-4 shrink-0" />
						{error}
					</div>
				)}

				{/* Import button */}
				{file && !result && (
					<button
						onClick={handleImport}
						disabled={importing}
						className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-semibold text-surface transition-all hover:bg-accent-hover active:scale-[0.98] disabled:opacity-50"
					>
						{importing ? (
							<><Loader2 className="h-4 w-4 animate-spin" /> Importing...</>
						) : (
							<><Upload className="h-4 w-4" /> Import Kit</>
						)}
					</button>
				)}

				{/* Result */}
				{result && (
					<div className="mt-6 rounded-xl border border-border bg-surface-elevated p-6 animate-fade-in-up">
						<div className="flex items-center gap-3 mb-4">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
								<Check className="h-5 w-5 text-emerald-400" />
							</div>
							<div>
								<p className="text-sm font-semibold text-text">Import successful</p>
								<p className="text-xs text-text-muted">{result.kit.name} v{result.kit.version}</p>
							</div>
						</div>

						{result.imported.length > 0 && (
							<div className="mb-4">
								<p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
									Imported ({result.imported.length})
								</p>
								<div className="space-y-1">
									{result.imported.map((item) => (
										<Link
											key={item.id}
											href={`/editor/${item.id}`}
											className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 hover:bg-accent/5 transition-colors"
										>
											<span className="text-[13px] text-text">{item.title}</span>
											<div className="flex items-center gap-2">
												<span className="text-[10px] text-text-faint uppercase">{item.type}</span>
												<span className="text-[10px] text-accent font-medium">Edit →</span>
											</div>
										</Link>
									))}
								</div>
							</div>
						)}

						{result.errors && result.errors.length > 0 && (
							<div className="mb-4">
								<p className="text-xs font-semibold uppercase tracking-wider text-error-soft mb-2">
									Errors ({result.errors.length})
								</p>
								<div className="space-y-1">
									{result.errors.map((err, i) => (
										<p key={i} className="text-xs text-error-soft">{err}</p>
									))}
								</div>
							</div>
						)}

						<div className="mt-4 flex gap-2">
							<Link href="/templates" className="flex-1 rounded-lg border border-border py-2 text-center text-sm font-medium text-text-muted hover:bg-surface hover:text-text transition-colors">
								View Templates
							</Link>
							<button
								onClick={() => { setFile(null); setResult(null); }}
								className="flex-1 rounded-lg bg-accent py-2 text-center text-sm font-semibold text-surface hover:bg-accent-hover transition-colors"
							>
								Import Another
							</button>
						</div>
					</div>
				)}

				{/* Info */}
				<div className="mt-6 rounded-lg border border-border-subtle bg-surface-elevated p-4">
					<p className="text-xs font-semibold text-text-muted mb-2">Supported Formats</p>
					<ul className="space-y-1 text-xs text-text-faint">
						<li>• Elementor template kits (.zip with manifest.json)</li>
						<li>• NewCMS native template kits (.zip)</li>
						<li>• Includes: headers, footers, pages, sections, archive templates</li>
						<li>• Site settings (colors, typography) applied to Design Kit</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
