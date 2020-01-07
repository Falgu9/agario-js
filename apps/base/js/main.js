window.addEventListener("load", event => new Base());

class Base {

	constructor() {
		console.log("loaded");

		this.initialize();
	}

	async initialize() {

		this.iospace = "baseapp"; // IO namespace for this app
		this.io = io.connect("http://localhost/" + this.iospace); // connect socket.io
		this.io.on("connect", () => this.onIOConnect()); // listen connect event

		this.mvc = new MVC("myMVC", this, new MyModel(), new MyView(), new MyController()); // init app MVC
		await this.mvc.initialize(); // run init async tasks
		this.mvc.model.io=this.io;
		this.mvc.view.attach(document.body); // attach view
		this.mvc.view.activate(); // activate user interface

	}

	/**
	 * @method test : test server GET fetch
	 */
	async test() {
		console.log("test server hello method");
		let result = await Comm.get("hello/everyone"); // call server hello method with argument "everyone"
		console.log("result", result);
		console.log("response", result.response);
	}


	/**
	 * @method onIOConnect : socket is connected
	 */
	onIOConnect() {
		trace("Connected to server");
		this.io.emit("con",{value: ""}); // send test message
		this.io.on("con_re", packet => this.onBlobData(packet)); // listen to "con_re" messages
	}


	/**
	 * @method onBlobData : con_re data received from io server
	 * @param {Object} data 
	 */
	onBlobData(data) {
		trace("Please choose a name");
		this.mvc.model.validateBlob(data); // send it to controller
	}
}

class MyModel extends Model {

	name;
	id;
	io;
	score;
	blob = [];
	windowX;
	windowY;
	cursor;

	constructor() {
		super();
	}

	async initialize(mvc) {
		super.initialize(mvc);

	}

	async connect(params) {
		trace("Waiting for name validation");
		// keep data in class variable ? refresh rate ?
		let result = await Comm.get("hello/"+params); // wait data from server
		return result.response; // return it to controller
	}

	validate(params){
		this.io.emit("validation",{value: params});
		this.io.on("valid_name",packet =>this.mvc.controller.valCon(packet));
	}

	validateBlob(params){
		this.blob = params;
		trace(params);
	}

	sendUpdatePositionMessage(){
		//trace(this.blob);	
		this.io.emit("update",{value: this.blob});//send blob x and y to server 
	}

	searchDataUpdate(){
		this.io.on("updated",packet =>this.mvc.controller.updateWorldData(packet));
		this.io.on("foodupdate",packet =>this.mvc.controller.updateFoodData(packet));
	}
}



class MyView extends View {
	x = null;
	y = null;
	ctx = null;
	ingame=0;
	is_on=0;
	food = null;
	blobs = null;
	cursor = null;
	interval =null;
	colorOfBlob = null;
	

	constructor() {
		super();
	}

	initialize(mvc) {
		super.initialize(mvc);
		//create input for nickname
		this.txt= document.createElement("input");
		this.txt.setAttribute("type", "text");
		this.txt.setAttribute("id" , "txt");
		this.txt.style.top="50%";
		this.stage.appendChild(this.txt);

		// create get test btn
		this.btn = document.createElement("button");
		this.btn.setAttribute("id","btn");
		this.btn.setAttribute("type", "button");
		this.btn.innerHTML = 'Play !';
		this.btn.style.float="left";
		this.btn.style.top="50%";
		this.stage.appendChild(this.btn);
	}

	showStartWindow(){
				//create input for nickname
				this.txt= document.createElement("input");
				this.txt.setAttribute("type", "text");
				this.txt.setAttribute("id" , "txt");
				this.stage.appendChild(this.txt);
		
				// create get test btn
				this.btn = document.createElement("button");
				this.btn.setAttribute("id","btn");
				this.btn.setAttribute("type", "button");
				this.btn.innerHTML = 'Play !';
				this.stage.appendChild(this.btn);
				
				this.ingame=0;
				this.activate();
				
				
	}

	//loading game scene 
	setGameStage(data){
		trace("generation du terrain");
		this.cleanStage();
		this.ingame=1;
		this.canvas = document.createElement("canvas");
		this.canvas.style.position = "fixed";
		this.canvas.setAttribute("width",4000);
		this.canvas.setAttribute("height",4000);
		this.canvas.style.border = "solid 0px";
		this.canvas.style.borderColor = "#000000";
		this.canvas.style.backgroundColor = "#F5F5DC";
		this.stage.appendChild(this.canvas);
		this.setScoreTab();
		this.ctx = this.canvas.getContext("2d");
		this.cursor = {
			x: window.innerWidth/2,
			y: window.innerHeight/2
		};
		this.mvc.model.blob.x= this.mvc.model.blob.x+this.cursor.x;
		this.mvc.model.blob.y= this.mvc.model.blob.y+this.cursor.y;
		this.activate();

		this.colorOfBlob = '#' + (function co(lor){   return (lor +=
			[0,1,2,3,4,5,6,7,8,9,'a','b','c','d','e','f'][Math.floor(Math.random()*16)])
			&& (lor.length == 6) ?  lor : co(lor); })('');
		trace(this.colorOfBlob);
	}

	setScoreTab(){
		let scoreTabWidth = 120;
		this.scoreTab = document.createElement("table");
		this.scoreTab.style.width = scoreTabWidth + "px";
		this.scoreTab.style.height = "100px";
		this.scoreTab.style.top = "10px";
		let l = window.innerWidth - scoreTabWidth - 10;
		this.scoreTab.style.left = l.toString() + "px";
		this.scoreTab.style.position = "absolute";
		this.scoreTab.style.backgroundColor = "#FFF5EE";
		this.scoreTab.style.border = "4px solid #F5F5DC";
		for(var i = 0; i < 11;i++){
			let element = document.createElement("li");
			element.style["margin-bottom","margin-top","margin-left","margin-right"] = "2px";
			this.scoreTab.appendChild(element);
		}
		this.stage.appendChild(this.scoreTab);
	}

	//creating the player's blob
	setBlob(){
		//trace(this.mvc.model.blob.score);
		this.ctx.beginPath();
		this.ctx.fillStyle = this.colorOfBlob;
		this.ctx.ellipse(this.mvc.model.blob.x,this.mvc.model.blob.y, this.mvc.model.blob.score,this.mvc.model.blob.score, 45 * Math.PI/180, 0, 2 * Math.PI); // x, y, taille,taille
		this.ctx.fill();
		this.ctx.stroke();
	}

	//function which draws food
	drawFood(food){
		//trace("drawing food");
		this.ctx.beginPath();
		this.ctx.fillStyle = food.color;
		this.ctx.ellipse(food.x,food.y, food.nourish,food.nourish, 45 * Math.PI/180, 0, 2 * Math.PI); // x, y, taille,taille
		this.ctx.fill();
		this.ctx.stroke();
	}

	//function which draws the other players blobs
	drawOthers(){
		for(let i=0;i<this.blobs.length;i++){
			if(this.blobs[i].name!=this.mvc.model.name && this.blobs[i].isAlive == true){
				this.ctx.beginPath();
				this.ctx.fillStyle = "#FF4200";
				this.ctx.ellipse(this.blobs[i].x,this.blobs[i].y, this.blobs[i].score,this.blobs[i].score, 45 * Math.PI/180, 0, 2 * Math.PI); // x, y, taille,taille
				this.ctx.fill();
				this.ctx.stroke();
			}
		}
	}

	//function to draw the entire game scene
	drawGame(){
		let windowWidth = window.innerWidth/2;
		let windowHeight = window.innerHeight/2;
		//trace("drawing game objects");
		//trace(this.mvc.model.blob.x);
	    this.ctx.setTransform(1,0,0,1,0,0);//reset the transform matrix as it is cumulative
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.save();
		//trace(this.mvc.model.blob.score);
		//this.ctx.scale(this.mvc.model.blob.score/20,this.mvc.model.blob.score/20);
		this.ctx.translate(windowWidth - this.mvc.model.blob.x ,windowHeight - this.mvc.model.blob.y);
		this.setBlob();
		for(let i=0;i<this.food.length;i++){
			this.drawFood(this.food[i]);
		}
		if(this.blobs.length>=2){
			this.drawOthers();
		}
		this.mvc.model.blob.x += (this.cursor.x - windowWidth)/50;
		this.mvc.model.blob.y += (this.cursor.y - windowHeight)/50;

		if(this.mvc.model.blob.x>= 4000){
			this.mvc.model.blob.x= 4000;
		}
		if(this.mvc.model.blob.y>= 4000){
			this.mvc.model.blob.y= 4000;
		}
		if(this.mvc.model.blob.x<=0){
			this.mvc.model.blob.x= 0;
		}
		if(this.mvc.model.blob.y<=0){
			this.mvc.model.blob.y= 0;
		}
		this.ctx.restore();
	}

	loopGame(){
		let _this = this;
		this.interval= setInterval(function() {
			_this.mvc.model.sendUpdatePositionMessage();
			_this.drawGame();
			_this.updateScore();
			
		},33);	
	}

	updateScore(){
		let scoreliste = [];
		scoreliste = this.blobs;
		scoreliste.sort(function(a, b) {
			return b.score - a.score;
		});
		trace(scoreliste);
		for(let i = 0; i < scoreliste.length;i++){
			this.scoreTab.children[i].innerHTML = "";
			if(scoreliste[i].name != "null" && scoreliste[i].isAlive == true){
				this.scoreTab.children[i].innerHTML =  parseInt(i + 1) + ". " + scoreliste[i].name + " " + scoreliste[i].score;
			}
		}
	}

	mouseUpdate(event,canvas){
		//trace("mouse moving");
		let rect = canvas.getBoundingClientRect();
		this.cursor = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		};
		this.mvc.model.windowX=event.clientX;
		this.mvc.model.windowY=event.clientY;
		//trace(this.cursor);
		if(this.is_on==0){
			this.drawGame();
			this.is_on=1;
		}
	}

	//remove all graphic elements 
	cleanStage(){
		this.deactivate();
		 while (this.stage.firstChild) {
    		this.stage.removeChild(this.stage.firstChild);
  		}
	}

	// activate UI
	activate() {
		super.activate();
		this.addListeners(); // listen to events
	}

	// deactivate
	deactivate() {
		super.deactivate();
		this.removeListeners();
	}

	addListeners() {

		if(this.ingame==0){
			this.getBtnHandler = e => this.btnClick(e);
			this.btn.addEventListener("click", this.getBtnHandler);
		}
		if(this.ingame==1){
			this.getCanvaHandler = e => this.mouseUpdate(e,this.canvas);
			this.canvas.addEventListener("mousemove",this.getCanvaHandler);
		}

	}

	removeListeners() {
		this.btn.removeEventListener("click", this.getBtnHandler);
	}

	btnClick(event) {
		let text = this.txt.value;
		if(text!=null){
			this.mvc.controller.btnWasClicked(text); 
		}else{
			trace("nickname is non valid!");
		} // dispatch
	}
}

class MyController extends Controller {
	name;
	
	constructor() {
		super();
	}

	initialize(mvc) {
		super.initialize(mvc);

	}

	async btnWasClicked(params) {
		trace("Name saved is", params);
		this.mvc.model.name=params;//save the name into the model object of this client
		this.name=params;
		this.mvc.view.cleanStage(); 
		//await this.mvc.model.connect(params);// wait async request > response from server and update view table values
		this.mvc.model.validate(params);
	}

	ioStartGame(data){
		let interval= null;
		this.mvc.view.setGameStage(data);
		this.mvc.view.drawGame();
		trace("starting loop");
		this.mvc.model.searchDataUpdate();
		this.mvc.view.loopGame();
	}

	valCon(packet){
		//trace(packet);
		if(packet.value==1){
			trace("Name is fine,game is starting.");
			this.mvc.view.food = packet.food;
			this.mvc.view.blobs = packet.others;
			this.ioStartGame(this.name);
		}else{
			trace("Name not fine, try a new one.");
			this.mvc.view.cleanStage();
			this.mvc.view.showStartWindow();
		}
	}

	//function which receive the world data from the server and save them into the view to be displayed
	updateWorldData(data){
		//trace(data.blob.isAlive);
		if(data.blob.isAlive==true){
		
			this.mvc.model.blob.score = data.blob.score;
			this.mvc.view.blobs=data.other_blobs;
		}else{
			this.mvc.model.blob.score = data.blob.score;
			this.mvc.model.blob.name = data.blob.name;
			this.mvc.view.blobs=data.other_blobs;
			//trace(this.mvc.model.blob.name);
			trace("you've been killed");
			clearInterval(this.mvc.view.interval);
			this.mvc.view.cleanStage();
			this.mvc.view.showStartWindow();
		}
	}

	updateFoodData(data){
		this.mvc.view.food = data.food;
	}
}