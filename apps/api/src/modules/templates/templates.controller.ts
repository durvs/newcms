import {
	Controller,
	Post,
	Get,
	Inject,
	UseGuards,
	UseInterceptors,
	UploadedFile,
	BadRequestException,
	HttpCode,
	HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { unzipSync, strFromU8 } from 'fflate';
import { DatabaseProvider } from '../../database.provider';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequireCapability } from '../../common/decorators/require-capability.decorator';
import { convertElementorTree, type ElementorNode } from '@newcms/editor';

/**
 * Envato/Elementor kit manifest format (array-based).
 */
interface EnvatoManifestEntry {
	name: string;
	screenshot?: string;
	source: string;
	preview_url?: string;
	type: string;
	category?: string;
	metadata?: {
		template_type?: string;
		include_in_zip?: string;
		elementor_pro_required?: boolean | null;
	};
}

interface EnvatoManifest {
	manifest_version?: string;
	title: string;
	page_builder?: string;
	kit_version?: string;
	templates: EnvatoManifestEntry[];
	required_plugins?: { name: string; slug?: string }[];
	images?: string[];
}

/**
 * Map template_type / name to our post type.
 */
function resolvePostType(entry: EnvatoManifestEntry): string {
	const tmplType = entry.metadata?.template_type ?? '';
	const name = entry.name.toLowerCase();

	if (tmplType === 'global-styles') return 'builder_global';
	if (tmplType === 'header' || name.includes('header')) return 'builder_header';
	if (tmplType === 'footer' || name.includes('footer')) return 'builder_footer';
	if (tmplType === 'single-post' || name.includes('single')) return 'builder_single_post';
	if (tmplType === 'single-page' || entry.type === 'page') return 'builder_page';
	if (tmplType === 'archive' || name.includes('archive') || name.includes('news')) return 'builder_archive';
	if (tmplType === 'error-404' || name.includes('404')) return 'builder_error_404';
	if (tmplType === 'search-results') return 'builder_search';
	if (name.includes('product')) return 'builder_product';
	return 'builder_section';
}

@ApiTags('templates')
@Controller('v2/templates')
export class TemplatesController {
	constructor(@Inject(DatabaseProvider) private readonly dbProvider: DatabaseProvider) {}

	@Post('import')
	@ApiOperation({ summary: 'Import a template kit (ZIP file)' })
	@ApiConsumes('multipart/form-data')
	@ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
	@ApiBearerAuth()
	@UseGuards(AuthGuard, PermissionGuard)
	@RequireCapability('edit_posts')
	@UseInterceptors(FileInterceptor('file'))
	@HttpCode(HttpStatus.OK)
	async importKit(@UploadedFile() file: Express.Multer.File) {
		if (!file) throw new BadRequestException('No file uploaded');
		if (!file.originalname.endsWith('.zip')) throw new BadRequestException('File must be a ZIP');

		try {
			const entries = unzipSync(new Uint8Array(file.buffer));

			// Find manifest
			const manifestRaw = entries['manifest.json'];
			if (!manifestRaw) throw new BadRequestException('ZIP missing manifest.json');
			const manifest: EnvatoManifest = JSON.parse(strFromU8(manifestRaw));

			const created: { id: number; title: string; type: string; postType: string }[] = [];
			const errors: string[] = [];

			for (const entry of manifest.templates) {
				try {
					// Read the template JSON from the ZIP
					const sourcePath = entry.source;
					const sourceRaw = entries[sourcePath];
					if (!sourceRaw) {
						errors.push(`Missing file: ${sourcePath}`);
						continue;
					}

					const templateJson = JSON.parse(strFromU8(sourceRaw));
					const content = templateJson.content;

					if (!Array.isArray(content)) {
						errors.push(`Invalid content in ${sourcePath}`);
						continue;
					}

					// Convert Elementor tree to NewCMS format
					const elements = convertElementorTree(content as ElementorNode[]);
					const postType = resolvePostType(entry);

					// Skip global styles (they're kit settings, not a visual template)
					if (postType === 'builder_global') {
						// Could extract site settings here in the future
						continue;
					}

					// Create post
					const post = await this.dbProvider.posts.create({
						postAuthor: 1,
						postTitle: entry.name,
						postType,
						postStatus: 'publish',
					});

					// Save builder data
					await this.dbProvider.posts.meta.add(post.id, '_builder_data', elements);
					await this.dbProvider.posts.meta.add(post.id, '_builder_edit_mode', 'builder');
					if (entry.metadata?.template_type) {
						await this.dbProvider.posts.meta.add(post.id, '_builder_template_type', entry.metadata.template_type);
					}

					created.push({
						id: post.id,
						title: entry.name,
						type: entry.metadata?.template_type ?? entry.type,
						postType,
					});
				} catch (err) {
					const msg = err instanceof Error ? err.message : 'Unknown error';
					errors.push(`${entry.name}: ${msg}`);
				}
			}

			return {
				success: true,
				kit: {
					name: manifest.title,
					version: manifest.kit_version ?? manifest.manifest_version ?? '1.0',
					templateCount: manifest.templates.length,
				},
				imported: created,
				errors: errors.length > 0 ? errors : undefined,
			};
		} catch (err) {
			if (err instanceof BadRequestException) throw err;
			const message = err instanceof Error ? err.message : 'Import failed';
			throw new BadRequestException(`Failed to import kit: ${message}`);
		}
	}

	@Get()
	@ApiOperation({ summary: 'List imported templates' })
	async listTemplates() {
		const { QueryEngine } = await import('@newcms/query-engine');
		const qe = new QueryEngine(this.dbProvider.db);
		const result = await qe.query({
			postType: [
				'builder_header', 'builder_footer', 'builder_single_post',
				'builder_page', 'builder_archive', 'builder_error_404',
				'builder_search', 'builder_section', 'builder_product',
			],
			postStatus: ['publish', 'draft'],
			perPage: 100,
		});
		return result.posts;
	}
}
