const ModuleBase = load("com/base"); // import ModuleBase class

class Base extends ModuleBase {

	blobs= [];
	food =[];
	sockets = [];
	foodGenerated = false;
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
		if(this.foodGenerated == false){
			for(let i=0;i<300;i++){
				this.food.push(new Food(Math.floor(Math.random() *4000),Math.floor(Math.random() * 4000),10));
			}
			this.foodGenerated = true;
		}
		socket.on("con", packet => this._onPlayerConnectReq(socket, packet)); // listen to "dummy" messages
		socket.on("validation",packet =>this._onValidate(socket,packet));
		socket.on("update",packet=>this._onUpdate(socket,packet));

	}

	_onPlayerConnectReq(socket, packet) { // dummy message received
		trace("Connection request received.");
		let blob = new Blob(socket.id,Math.floor(Math.random() *4000),Math.floor(Math.random() *4000),packet.value);
		blob.score = 20;
		this.sockets.push(socket);
		this.blobs.push(blob);
		trace("A new Blob is created.");
		trace("Waiting for a player name");
		socket.emit("con_re", {x: blob.x , y:blob.y, score:blob.score}); // answer dummy random message
	}

	_onValidate(socket,packet){
		let i=0;
		let validate=1;
		trace("Checking if name is available and valid.");
		//let answer = ["hello", ...params, "welcome!"].join(" "); // say hello
		for (let i=0;i<this.blobs.length;i++){
			if(this.blobs[i].name==packet.value){
				trace("name already taken or non-valid.")
				validate=0;
				socket.emit("valid_name",{value: 0});
			}
		}
		if(validate==1){
			for(let i=0;i<this.blobs.length;i++){
				if(this.blobs[i].id==socket.id){
					trace("name is valid and has been saved");
					this.blobs[i].name=packet.value;
				}
			}
			socket.emit("valid_name",{value: 1, food: this.food, others: this.blobs});
		}
	}

	_onUpdate(socket,packet){
		let my_blob =null;
		//trace(packet);
		for(let i=0;i<this.blobs.length;i++){
			if(this.blobs[i].id==socket.id){
				this.blobs[i].x = packet.value.x;
				this.blobs[i].y = packet.value.y;
				

				for(let j = 0;j<this.blobs.length;j++){
					if(this.blobs[i].id!=this.blobs[j].id){
						trace(this.blobs[i].score);
						var dx = this.blobs[i].x - this.blobs[j].x;
						var dy = this.blobs[i].y - this.blobs[j].y;
						var distance = Math.sqrt(dx * dx + dy * dy);
						if (distance < this.blobs[i].score + this.blobs[j].score){
							if(this.blobs[i].score > this.blobs[j].score){
								this.blobs[j].score = 0;
							}
							else{
								this.blobs[i].score = 0;
							}
						}
					}
				}
				for(let j = 0;j<this.food.length;j++){
					var dx = this.blobs[i].x - this.food[j].x;
					var dy = this.blobs[i].y - this.food[j].y;
					var distance = Math.sqrt(dx * dx + dy * dy);
					if (distance < this.blobs[i].score + this.food[j].nourish){
						this.blobs[i].score += this.food[j].nourish/5;
						this.food.splice(j,1);
						this.food.push(new Food(Math.floor(Math.random() *4000),Math.floor(Math.random() * 4000),10));
					}
				}

				//tester si en vie 
				//if scores == 0 it means the blob is dead
				my_blob=this.blobs[i]; 
			}
		}
		socket.emit("updated",{blob: my_blob, other_blobs: this.blobs});
		for(let i = 0;i < this.sockets.length;i++){
			this.sockets[i].emit("foodupdate", {food: this.food});
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