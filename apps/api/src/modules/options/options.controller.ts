import { Controller, Get, Put, Body, Param, Inject, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { DatabaseProvider } from '../../database.provider';

@ApiTags('options')
@Controller('v2/settings')
export class OptionsController {
	constructor(@Inject(DatabaseProvider) private readonly dbProvider: DatabaseProvider) {}

	@Get()
	@ApiOperation({ summary: 'Get all public settings' })
	async getAll() {
		const publicOptions = [
			'blogname',
			'blogdescription',
			'siteurl',
			'home',
			'posts_per_page',
			'date_format',
			'time_format',
			'permalink_structure',
		];

		const result: Record<string, unknown> = {};
		for (const name of publicOptions) {
			result[name] = await this.dbProvider.options.getOption(name);
		}
		return result;
	}

	@Get(':name')
	@ApiOperation({ summary: 'Get a setting by name' })
	@ApiParam({ name: 'name', type: String })
	async getByName(@Param('name') name: string) {
		const value = await this.dbProvider.options.getOption(name);
		if (value === undefined) throw new NotFoundException(`Setting "${name}" not found`);
		return { name, value };
	}

	@Put(':name')
	@ApiOperation({ summary: 'Update a setting' })
	@ApiParam({ name: 'name', type: String })
	async update(@Param('name') name: string, @Body() body: { value: unknown }) {
		await this.dbProvider.options.updateOption(name, body.value);
		return { name, value: body.value, updated: true };
	}
}
