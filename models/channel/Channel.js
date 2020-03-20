const Model = require('../../utils/model/Model');

class Channel extends Model {

	static get table() {
		return 'channels';
	}

	static get model() {
		return {
			id: {
				type: 'SNOWFLAKE'
			},
			name: {
				type: 'VARCHAR(32)',
				notNull: true
			},
			is_nsfw: {
				type: 'BOOLEAN',
				notNull: true
			},
			type: {
				type: 'SMALLINT',
				notNull: true
			},
			guild_id: {
				type: 'BIGINT',
				notNull: true
			}
		};
	}


}

module.exports = Channel;