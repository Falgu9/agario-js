const ModuleBase = load("com/base"); // import ModuleBase class

class Base extends ModuleBase {

	blobs= [];
	food =[];
	constructor(app, settings) {
		super(app, new Map([["name", "baseapp"], ["io", true]]));
	}

	/**
	 * @method connect : world
	 * @param {*} req 
	 * @param {*} res 
	 * @param  {...*} params : some arguments
	 */
	/*connect(req, res, ... params) {
		let answer = ["hello", ...params, "!"].join(" "); // say hello
		trace(answer); // say it
		this.sendJSON(req, res, 200, {message: answer}); // answer JSON
	}*/


	/**
	 * @method _onIOConnect : new IO client connected
	 * @param {*} socket 
	 */
	_onIOConnect(socket) {
		super._onIOConnect(socket); // do not remove super call
		for(let i=0;i<50;i++){
			this.food.push(new Food(Math.floor(Math.random() *4000),Math.floor(Math.random() * 4000),Math.floor(Math.random() * 25)));
		}
		socket.on("con", packet => this._onPlayerConnectReq(socket, packet)); // listen to "dummy" messages
		socket.on("validation",packet =>this._onValidate(socket,packet));
	}

	_onPlayerConnectReq(socket, packet) { // dummy message received
		trace("Connection request received.");
		let blob = new Blob(socket.id,new Food(Math.floor(Math.random() *4000)),new Food(Math.floor(Math.random() *4000)),packet);
		blob.score = 25;
		this.blobs.push(blob);
		trace("A new Blob is created.");
		trace("Waiting for a player name");
		socket.emit("con_re", {x: blob.x , y:blob.y, score:blob.score}); // answer dummy random message
	}

	_onValidate(socket,packet){
		let i=0;
		let validate=1;
		let data = this.food;
		trace(this.food[0]);
		trace("Checking if name is available and valid.");
		//let answer = ["hello", ...params, "welcome!"].join(" "); // say hello
		for (let i=0;i<this.blobs.length;i++){
			if(this.blobs[i].name==packet){
				trace("name already taken or non-valid.")
				validate=0;
				socket.emit("valid_name",{value: 0});
			}
		}
		if(validate==1){
			for(let i=0;i<this.blobs.length;i++){
				if(this.blobs[i].id==socket.id){
					trace("name is valid and has been saved");
					this.blobs[i].name=packet;
				}
			}
			socket.emit("valid_name",{value: 1, food: data});
		}
	}

}

class Blob {

    id;
    x;
    y;
	name;
	score;

    constructor(id, x, y,name){
        this.id =id;
        this.x = x;
		this.y = y;
		this.name = name;
    }

}

class Food {

    x;
    y;
	nourish;

    constructor(x, y,nourish){
        this.nourish =nourish;
        this.x = x;
		this.y = y;
    }

}
module.exports = Base; // export app class