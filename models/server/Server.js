const Model = require('../../utils/model/Model');

class Server extends Model {

	static get table() {
		return 'servers';
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
			icon: {
				type: 'VARCHAR(34)'
			},
			owner_id: {
				type: 'BIGINT',
				notNull: true
			}
		};
	}


}

module.exports = Server;