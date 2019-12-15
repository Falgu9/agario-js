const ModuleBase = load("com/base"); // import ModuleBase class

class Base extends ModuleBase {

	blobs= [];
	constructor(app, settings) {
		super(app, new Map([["name", "baseapp"], ["io", true]]));
	}

	/**
	 * @method hello : world
	 * @param {*} req 
	 * @param {*} res 
	 * @param  {...*} params : some arguments
	 */
	hello(req, res, ... params) {
		let answer = ["hello", ...params, "!"].join(" "); // say hello
		trace("answer"); // say it
		this.sendJSON(req, res, 200, {message: answer}); // answer JSON
	}

	/**
	 * @method connect : world
	 * @param {*} req 
	 * @param {*} res 
	 * @param  {...*} params : some arguments
	 */
	connect(req, res, ... params) {
		let answer = ["hello", ...params, "!"].join(" "); // say hello
		trace(answer); // say it
		this.sendJSON(req, res, 200, {message: answer}); // answer JSON
	}


	/**
	 * @method _onIOConnect : new IO client connected
	 * @param {*} socket 
	 */
	_onIOConnect(socket) {
		super._onIOConnect(socket); // do not remove super call
		trace("OKKKKKKKKKKKKKKKKKKKKKKKKKKKKKk");
		socket.on("con", packet => this._onDummyData(socket, packet)); // listen to "dummy" messages
	}

	_onDummyData(socket, packet) { // dummy message received
		trace("connection asked");
		let blob = new Blob(socket.id,0,0,packet);
		this.blobs.push(blob);
		socket.emit("con_re", {message: "you are now connected", value: socket.id}); // answer dummy random message
	}

}

class Blob {

    id;
    x;
    y;
    name;

    constructor(id, x, y,name){
        this.id =id;
        this.x = x;
		this.y = y;
		this.name = name;
    }

}

module.exports = Base; // export app class