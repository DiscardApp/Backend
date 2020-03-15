const ControllerContext = require('../utils/http/ControllerContext');

class Index extends ControllerContext {
	route(router) {
		router.register('/', this);
	}

	get() {
		this.respond('DiscardApp');
	}
}

module.exports = Index;