const Model = require('../../utils/model/Model');

class Guild extends Model {

	static get table() {
		return 'users';
	}

	static get modelID() {
		return 4;
	}

	static get model() {
		return {
			id: {
				type: 'BIGINT'
			},
			name: {
				type: 'VARCHAR(32)',
				notNull: true
			},
			icon: {
				type: 'VARCHAR(34)'
			},
			owner: {
				type: 'SNOWFLAKE',
				notNull: true
			}
		};
	}


}

module.exports = Guild;