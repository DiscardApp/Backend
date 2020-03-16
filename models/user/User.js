const Model = require('../../utils/model/Model');

class User extends Model {

	static get table() {
		return 'users';
	}

	static get model() {
		return {
			id: {
				type: 'SNOWFLAKE'
			},
			username: {
				type: 'VARCHAR(32)',
				notNull: true
			}
		};
	}

}

module.exports = User;