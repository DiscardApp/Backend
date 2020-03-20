const ControllerContext = require('../../utils/http/ControllerContext');
const Server = require('../../models/server/Server');

class Servers extends ControllerContext {
	route(router) {
		router.register('/servers/{id}', this);
	}

	async get() {
		if (this.parameters.route.id) return this.show();
		else return this.list();
	}

	async list() {
		const servers = await Server.list();
		this.respond(servers.toAPIResponse());
	}

	async show() {
		const { id } = this.parameters.route;
		const servers = await Server.find({ id });
		if (!servers)
			return this.notFound('Server not found');

		this.respond(servers.toAPIResponse());
	}
}

module.exports = Servers;