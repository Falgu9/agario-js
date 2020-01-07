const ModuleBase = load("com/base"); // import ModuleBase class

class Base extends ModuleBase {

	blobs= []; // Is a table which contains all players 
	food =[]; // Is a table which contains all food objects for the game
	sockets = []; //Is a table which contains all sockets from clients
	foodGenerated = false;// A boolean to know if food is generated or not

	constructor(app, settings) {
		super(app, new Map([["name", "baseapp"], ["io", true]]));
	}


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
		socket.on("disconnect",packet=>this._onIODisconnect(socket,packet));
	}

	/**
	 * @method _onPlayerConnectReq : triggers when a client is connected
	 * @param {*} socket
	 * @param {*} packet
	 */
	_onPlayerConnectReq(socket, packet) { // dummy message received
		trace("Connection request received.");
		let blob = new Blob(socket.id,Math.floor(Math.random() *4000),Math.floor(Math.random() *4000),"null");
		blob.score = 20;
		this.sockets.push(socket);
		this.blobs.push(blob);
		trace("A new Blob is created.");
		trace("Waiting for a player name");
		socket.emit("con_re", {x: blob.x , y:blob.y, score:blob.score}); // answer dummy random message
	}

	/**
	 * @method _onValidate : confirm if the player has entered an available name 
	 * @param {*} socket 
	 * @param {*} packet : packet.value is the name that the player has chosen 
	 */
	_onValidate(socket,packet){
		let i=0;
		let validate=1;
		trace("Checking if name is available and valid.");
		let l = packet.value.length<6;
		trace(l);

		if(l==false){
			validate=0;
			trace("name already taken or non-valid.")
				validate=0;
				socket.emit("valid_name",{value: 0});
		}
		if(validate==1){
			for (let i=0;i<this.blobs.length;i++){
				if((this.blobs[i].name==packet.value) && (this.blobs[i].isAlive==true)){
					trace("name already taken or non-valid.")
					validate=0;
					socket.emit("valid_name",{value: 0});
				}
			}
		}
		if(validate==1){
			for(let i=0;i<this.blobs.length;i++){
				if(this.blobs[i].id==socket.id){
					trace("name is valid and has been saved");
					this.blobs[i].name=packet.value;
					this.blobs[i].isAlive=true;
				}
			}
			socket.emit("valid_name",{value: 1, food: this.food, others: this.blobs});
		}
	}

	/**
	 * @method _onUpdate : triggers when an update message is sent by client and send them new datas
	 * @param {*} socket
	 * @param {*} packet  : it is a blob object sent by the client 
	 */
	_onUpdate(socket,packet){
		let my_blob =null;
		//trace(packet);
		for(let i=0;i<this.blobs.length;i++){
			if(this.blobs[i].id==socket.id){
				this.blobs[i].x = packet.value.x;
				this.blobs[i].y = packet.value.y;
				for(let j = 0;j<this.blobs.length;j++){
					if(this.blobs[i].id!=this.blobs[j].id){
						//trace(this.blobs[i].score);
						var dx = this.blobs[i].x - this.blobs[j].x;
						var dy = this.blobs[i].y - this.blobs[j].y;
						var distance = Math.sqrt(dx * dx + dy * dy);
						if (distance < this.blobs[i].score + this.blobs[j].score){
							if(this.blobs[i].score > this.blobs[j].score){
								this.blobs[i].score += this.blobs[j].score;
								this.blobs[j].score = 20;
								this.blobs[j].name  = "null";
								//trace(this.blobs[j].score);
								this.blobs[j].x = Math.floor(Math.random() *4000);
								this.blobs[j].y = Math.floor(Math.random() *4000);
								this.blobs[j].isAlive = false;
							}
							else{
								this.blobs[j].score += this.blobs[i].score;
								this.blobs[i].score = 20;
								this.blobs[i].name  = "null";
								//trace(this.blobs[j].score);
								this.blobs[i].x = Math.floor(Math.random() *4000);
								this.blobs[i].y = Math.floor(Math.random() *4000);
								this.blobs[i].isAlive = false;
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

	/**
	 * @method _onIODisconnect : triggered when the server receives a disconnect message from a client and update the data 
	 * @param {*} socket
	 */
	_onIODisconnect(socket){
		let deletedBlob = null;
		for(let i=0;i<this.blobs.length;i++){
			if(this.blobs[i].id==socket.id){
				deletedBlob = this.blobs[i];
				this.blobs.splice(i,1);
			}
		}

		for(let i=0;i<this.sockets.length;i++){
			if(this.sockets[i].id==socket.id){
				this.sockets.splice(i,1);
			}else{
				this.sockets[i].emit("disco",{other_blobs: this.blobs});
			}
		}
		super._onIODisconnect(socket);
	}

	//END OF CLASS 
}

class Blob {

    id;
    x;
    y;
	name;
	score;
	isAlive;

    constructor(id, x, y,name){
        this.id =id;
        this.x = x;
		this.y = y;
		this.name = name;
		this.isAlive=true;
    }

}

class Food {

    x;
    y;
	nourish;
	color;

    constructor(x, y,nourish){
        this.nourish =nourish;
        this.x = x;
		this.y = y;
		this.color = '#' + (function co(lor){   return (lor +=
			[0,1,2,3,4,5,6,7,8,9,'a','b','c','d','e','f'][Math.floor(Math.random()*16)])
			&& (lor.length == 6) ?  lor : co(lor); })('');
    }

}
module.exports = Base; // export app class