const ControllerContext = require('../../utils/http/ControllerContext');
const Channel = require('../../models/server/Server');

class Channels extends ControllerContext {
	route(router) {
		router.register('/channels/{id}', this);
	}

	async get() {
		if (this.parameters.route.id) return this.show();
		else return this.list();
	}

	async list() {
		const servers = await Channel.list();
		this.respond(servers.toAPIResponse());
	}

	async show() {
		const {id} = this.parameters.route;
		const servers = await Channel.find({id});
		if (!servers)
			return this.notFound('Channel not found');

		this.respond(servers.toAPIResponse());
	}
}

module.exports = Channels;