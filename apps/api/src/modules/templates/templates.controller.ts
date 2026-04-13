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
import {
	importKit,
	convertElementorTree,
	type KitManifest,
	type KitSiteSettings,
	type ElementorNode,
} from '@newcms/editor';

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
			// Extract ZIP
			const entries = unzipSync(new Uint8Array(file.buffer));

			// Parse manifest
			const manifestRaw = entries['manifest.json'];
			if (!manifestRaw) throw new BadRequestException('ZIP missing manifest.json');
			const manifest: KitManifest = JSON.parse(strFromU8(manifestRaw));

			// Parse site settings
			let siteSettings: KitSiteSettings | undefined;
			if (entries['site-settings.json']) {
				siteSettings = JSON.parse(strFromU8(entries['site-settings.json']));
			}

			// Parse template files
			const templateFiles = new Map<string, Record<string, unknown>>();
			if (manifest.templates) {
				for (const id of Object.keys(manifest.templates)) {
					const path = `templates/${id}.json`;
					if (entries[path]) {
						templateFiles.set(id, JSON.parse(strFromU8(entries[path])));
					}
				}
			}

			// Parse content files
			const contentFiles = new Map<string, Record<string, unknown>>();
			if (manifest.content) {
				for (const [postType, posts] of Object.entries(manifest.content)) {
					for (const postId of Object.keys(posts)) {
						const path = `content/${postType}/${postId}.json`;
						if (entries[path]) {
							contentFiles.set(`${postType}/${postId}`, JSON.parse(strFromU8(entries[path])));
						}
					}
				}
			}

			// Run the importer
			const result = importKit(manifest, siteSettings, templateFiles, contentFiles);

			// Create posts for templates
			const createdTemplates: { id: number; title: string; type: string }[] = [];
			for (const tmpl of result.templates) {
				const post = await this.dbProvider.posts.create({
					postAuthor: 1,
					postTitle: tmpl.title,
					postType: `builder_${tmpl.docType.replace(/-/g, '_')}`,
					postStatus: 'publish',
				});

				// Save builder data
				await this.dbProvider.posts.meta.add(post.id, '_builder_data', tmpl.elements);
				if (tmpl.conditions) {
					await this.dbProvider.posts.meta.add(post.id, '_builder_conditions', tmpl.conditions);
				}
				if (tmpl.location) {
					await this.dbProvider.posts.meta.add(post.id, '_builder_location', tmpl.location);
				}
				await this.dbProvider.posts.meta.add(post.id, '_builder_edit_mode', 'builder');

				createdTemplates.push({ id: post.id, title: tmpl.title, type: tmpl.docType });
			}

			// Create posts for content
			const createdContent: { id: number; title: string; type: string }[] = [];
			for (const item of result.content) {
				const post = await this.dbProvider.posts.create({
					postAuthor: 1,
					postTitle: item.title,
					postType: item.postType === 'page' ? 'page' : 'post',
					postStatus: 'publish',
					postExcerpt: item.excerpt,
				});

				await this.dbProvider.posts.meta.add(post.id, '_builder_data', item.elements);
				await this.dbProvider.posts.meta.add(post.id, '_builder_edit_mode', 'builder');

				createdContent.push({ id: post.id, title: item.title, type: item.postType });
			}

			// Save site settings to design kit option if present
			if (result.siteSettings) {
				await this.dbProvider.options.updateOption('builder_design_kit', result.siteSettings);
			}

			return {
				success: true,
				kit: {
					name: manifest.title ?? manifest.name,
					version: manifest.version,
				},
				imported: {
					templates: createdTemplates,
					content: createdContent,
					mediaUrls: result.mediaUrls.length,
				},
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
			postType: ['builder_header', 'builder_footer', 'builder_single_post', 'builder_single_page', 'builder_archive', 'builder_error_404', 'builder_search_results', 'builder_section', 'builder_page'],
			postStatus: ['publish', 'draft'],
			perPage: 100,
		});
		return result.posts;
	}
}
