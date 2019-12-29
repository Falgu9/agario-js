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
		this.io.emit("con", {value: "positions_futures"}); // send test message
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
	blob = [];
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
		trace(this.blob);
	}

	updatePosition(params){
		this.io.emit("update",{value: params});
		this.io.on("updated",packet =>this.mvc.controller.valCon(packet));
	}

}

class MyView extends View {

	x = null;
	y = null;
	ctx = null;
	ingame=0;
	is_on=0;
	food = null;


	constructor() {
		super();
	}

	initialize(mvc) {
		super.initialize(mvc);

		//create input for nickname
		this.txt= document.createElement("input");
		this.txt.setAttribute("type", "text");
		this.txt.setAttribute("id" , "txt");
		this.stage.appendChild(this.txt);

		// create get test btn
		this.btn = document.createElement("button");
		this.btn.setAttribute("id","btn");
		this.btn.setAttribute("type", "button");
		this.btn.setAttribute("value", "Play");
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
				this.btn.setAttribute("value", "Play");
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
		//this.canvas.style.top = "-100px";
		//this.canvas.style.left = "-500px";
		//this.canvas.style.position = "absolute";
		this.canvas.setAttribute("width",window.innerWidth);
		this.canvas.setAttribute("height",window.innerHeight);
		this.canvas.style.border = "solid 0px";
		this.canvas.style.borderColor = "#000000";
		this.canvas.style.backgroundColor = "beige";
		this.stage.appendChild(this.canvas);
		this.ctx = this.canvas.getContext("2d");
		this.activate();
	}

	//creating the player's blob
	setBlob(){
		trace("drawing blob");
		this.ctx.beginPath();
		this.ctx.fillStyle = "#FF4422";
		if(this.is_on=0){
			this.ctx.ellipse(window.innerWidth/2,window.innerHeight/2, 25,25, 45 * Math.PI/180, 0, 2 * Math.PI); // x, y, taille,taille
		}
		else{
			this.ctx.ellipse(this.mvc.model.blob.x,this.mvc.model.blob.y, 25,25, 45 * Math.PI/180, 0, 2 * Math.PI);
		}
		this.ctx.fill();
		this.ctx.stroke();
	}

	drawFood(food){
		trace("drawing food");
		this.ctx.beginPath();
		this.ctx.fillStyle = "#FF4400";
		this.ctx.ellipse(food.x,food.y, 10,10, 45 * Math.PI/180, 0, 2 * Math.PI); // x, y, taille,taille
		this.ctx.fill();
		this.ctx.stroke();
	}
	

	//function to draw the entire game scene
	drawGame(){
		trace("drawing game objects");
	    this.ctx.setTransform(1,0,0,1,0,0);//reset the transform matrix as it is cumulative
    	this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.setBlob();
		for(let i=0;i<50;i++){
			this.drawFood(this.food[i]);
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

	mouseUpdate(event,canvas){
		trace("mouse moving");
		let rect = canvas.getBoundingClientRect();
		let cursor = {
			x: (event.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
			y: (event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
		};
		this.mvc.model.blob.x=cursor.x;
		this.mvc.model.blob.y=cursor.y;
		trace(cursor);
		this.drawGame();


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

	ioStartGame(data,foods){
		trace(data);
		//this.
		this.mvc.view.setGameStage(data);
		this.mvc.view.drawGame(foods);
	}

	valCon(packet){
		trace(packet.food);
		if(packet.value==1){
			trace("Name is fine,game is starting.");
			this.mvc.view.food = packet.food;
			this.ioStartGame(this.name);
		}else{
			trace("Name not fine, try a new one.");
			this.mvc.view.prepareStage();
			this.mvc.view.showStartWindow();
		}
	}

	updateGameScene(packet){

	}
}