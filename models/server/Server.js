const Model = require('../../utils/model/Model');

class Server extends Model {

	static get table() {
		return 'servers';
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

module.exports = Server;