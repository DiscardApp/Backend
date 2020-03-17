const ControllerContext = require('../../utils/http/ControllerContext');
const Guild = require('../../models/user/Guild');

class Guilds extends ControllerContext {
	route(router) {
		router.register('/guilds/{id}', this);
	}

	async get() {
		if (this.parameters.route.id) return this.show();
		else return this.list();
	}

	async list() {
		const guilds = await Guild.list();
		this.respond(guilds.toAPIResponse());
	}

	async show() {
		const { id } = this.parameters.route;
		const guilds = await Guild.find({ id });
		if (!guilds)
			return this.notFound({ message: 'Guild not found', code: 10000 + Guild.modelID });

		this.respond(guilds.toAPIResponse());
	}
}

module.exports = Guilds;