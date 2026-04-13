import {
	Controller,
	Get,
	Post,
	Delete,
	Param,
	Body,
	Inject,
	ParseIntPipe,
	HttpCode,
	HttpStatus,
	NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { DatabaseProvider } from '../../database.provider';

@ApiTags('taxonomies')
@Controller('v2')
export class TaxonomyController {
	constructor(@Inject(DatabaseProvider) private readonly dbProvider: DatabaseProvider) {}

	@Get('categories')
	@ApiOperation({ summary: 'List categories' })
	async listCategories() {
		return this.dbProvider.taxonomy.getTerms('category');
	}

	@Get('tags')
	@ApiOperation({ summary: 'List tags' })
	async listTags() {
		return this.dbProvider.taxonomy.getTerms('post_tag');
	}

	@Post('categories')
	@ApiOperation({ summary: 'Create a category' })
	@HttpCode(HttpStatus.CREATED)
	async createCategory(@Body() body: { name: string; slug?: string; description?: string; parent?: number }) {
		return this.dbProvider.taxonomy.createTerm({
			...body,
			taxonomy: 'category',
		});
	}

	@Post('tags')
	@ApiOperation({ summary: 'Create a tag' })
	@HttpCode(HttpStatus.CREATED)
	async createTag(@Body() body: { name: string; slug?: string; description?: string }) {
		return this.dbProvider.taxonomy.createTerm({
			...body,
			taxonomy: 'post_tag',
		});
	}

	@Delete('categories/:id')
	@ApiOperation({ summary: 'Delete a category' })
	@ApiParam({ name: 'id', type: Number })
	async deleteCategory(@Param('id', ParseIntPipe) id: number) {
		const deleted = await this.dbProvider.taxonomy.deleteTerm(id, 'category');
		if (!deleted) throw new NotFoundException(`Category ${id} not found`);
		return { deleted: true };
	}

	@Delete('tags/:id')
	@ApiOperation({ summary: 'Delete a tag' })
	@ApiParam({ name: 'id', type: Number })
	async deleteTag(@Param('id', ParseIntPipe) id: number) {
		const deleted = await this.dbProvider.taxonomy.deleteTerm(id, 'post_tag');
		if (!deleted) throw new NotFoundException(`Tag ${id} not found`);
		return { deleted: true };
	}
}
