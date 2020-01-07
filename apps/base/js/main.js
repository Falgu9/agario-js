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
		this.mvc.model.validateBlob(data); 
	}
}

class MyModel extends Model {

	name;
	id;
	io;
	score;
	blob = [];
	cursor;

	constructor() {
		super();
	}

	async initialize(mvc) {
		super.initialize(mvc);

	}

	/**
	 * @method validate : send validation message when client click 
	 * @param  {...*} params : some arguments
	 */
	validate(params){
		this.io.emit("validation",{value: params});
		this.io.on("valid_name",packet =>this.mvc.controller.valCon(packet));
	}

	/**
	 * @method validateBlob : save the blob which at this point only contains a name
	 * @param  {...*} params : some arguments
	 */
	validateBlob(params){
		this.blob = params;
		trace(params);
	}

	/**
	 * @method sendUpdatePositionMessage : send the update message which allow the client to refresh himself
	 */
	sendUpdatePositionMessage(){
		//trace(this.blob);	
		this.io.emit("update",{value: this.blob,isOnline: true});//send blob x and y to server 
	}

	/**
	 * @method searchDataUpdate : send messages to the server to update his datas
	 */
	searchDataUpdate(){
		this.io.on("updated",packet =>this.mvc.controller.updateWorldData(packet));
		this.io.on("foodupdate",packet =>this.mvc.controller.updateFoodData(packet));
		this.io.on("disco",packet=>this.mvc.controller.updateOnDisc(packet));
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
		this.stage.appendChild(this.txt);

		// create get test btn
		this.btn = document.createElement("button");
		this.btn.setAttribute("id","btn");
		this.btn.setAttribute("type", "button");
		this.btn.innerHTML = 'Play !';
		this.btn.style.float="left";
		this.stage.appendChild(this.btn);
	}

	/**
	 * @method showStartWindow : function which create the start window elements
	 */
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

	/**
	 * @method setGameStage : function which create the game elements (canvas)
	 */
	setGameStage(){
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
	}

	/**
	 * @method setScoreTab : create the score tab element
	 */
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

	/**
	 * @method setBlob : draw the player's blob
	 */
	setBlob(){
		this.ctx.beginPath();
		this.ctx.fillStyle = this.colorOfBlob;
		this.ctx.ellipse(this.mvc.model.blob.x,this.mvc.model.blob.y, this.mvc.model.blob.score,this.mvc.model.blob.score, 45 * Math.PI/180, 0, 2 * Math.PI); // x, y, taille,taille
		this.ctx.fill();
		this.ctx.stroke();
	}

	/**
	 * @method drawFood : draw circles which are food in the canva
	 * @param {*} food: is on food object 
	 */
	drawFood(food){
		this.ctx.beginPath();
		this.ctx.fillStyle = food.color;
		this.ctx.ellipse(food.x,food.y, food.nourish,food.nourish, 45 * Math.PI/180, 0, 2 * Math.PI); // x, y, taille,taille
		this.ctx.fill();
		this.ctx.stroke();
	}

	/**
	 * @method drawOthers : function which draws the others players around your view
	 */
	drawOthers(){
		for(let i=0;i<this.blobs.length;i++){
			if(this.blobs[i].name!=this.mvc.model.name && this.blobs[i].isAlive == true){
				this.ctx.beginPath();
				this.ctx.fillStyle = "black";
				this.ctx.ellipse(this.blobs[i].x,this.blobs[i].y, this.blobs[i].score,this.blobs[i].score, 45 * Math.PI/180, 0, 2 * Math.PI); // x, y, taille,taille
				this.ctx.fill();
				this.ctx.stroke();
			}
		}
	}

	/**
	 * @method drawGame : main draw method which draws the entire game universe
	 */
	drawGame(){
		let windowWidth = window.innerWidth/2;
		let windowHeight = window.innerHeight/2;
	    this.ctx.setTransform(1,0,0,1,0,0);//reset the transform matrix as it is cumulative
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.save();
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

	/**
	 * @method loopGame : very important function which allow the game to update himself constantly
	 */
	loopGame(){
		let _this = this;
		this.interval= setInterval(function() {
			_this.mvc.model.sendUpdatePositionMessage();
			_this.drawGame();
			_this.updateScore();
			
		},33);	
	}

	/**
	 * @method updateScore : function which updates the scoreliste values to show
	 */
	updateScore(){
		let scoreliste = [];
		scoreliste = this.blobs;
		scoreliste.sort(function(a, b) {
			return b.score - a.score;
		});
		for(let i=0; i < 10;i++){
			this.scoreTab.children[i].innerHTML = "";
		}
		for(let i = 0; i < scoreliste.length;i++){
			
			if(scoreliste[i].name != "null" && scoreliste[i].isAlive == true){
				this.scoreTab.children[i].innerHTML =  parseInt(i + 1) + ". " + scoreliste[i].name + " " + scoreliste[i].score;
			}
		}
	}

	/**
	 * @method mouseUpdate : function which is triggered when the mouse move and calculate the position on the canva
	 * @param {*} event
	 * @param {*} canvas
	 */
	mouseUpdate(event,canvas){
		let rect = canvas.getBoundingClientRect();
		this.cursor = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		};
		if(this.is_on==0){
			this.drawGame();
			this.is_on=1;
		}
	}

	/**
	 * @method cleanStage : function which destroy all elements attached to the stage
	 */
	cleanStage(){
		this.deactivate();
		 while (this.stage.firstChild) {
    		this.stage.removeChild(this.stage.firstChild);
  		}
	}

	/**
	 * @method activate : function which activates all listeners
	 */
	activate() {
		super.activate();
		this.addListeners(); // listen to events
	}

	/**
	 * @method deactivate: function which deactivate all listeners
	 */
	deactivate() {
		super.deactivate();
		this.removeListeners();
	}

	/**
	 * @method addListeners: function which attach listener to their elements
	 */
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

	/**
	 * @method removeListeners : remove the listenners from their elemets
	 */
	removeListeners() {
		this.btn.removeEventListener("click", this.getBtnHandler);
	}

	/**
	 * @method btnClick : function called when the button was click
	 */
	btnClick(event) {
		let text = this.txt.value;
		if(text!=null){
			this.mvc.controller.btnWasClicked(text); 
		}else{
			trace("nickname is non valid!");
		} // dispatch
	}

	//END OF VIEW CLASS
}

class MyController extends Controller {
	name;
	
	constructor() {
		super();
	}

	initialize(mvc) {
		super.initialize(mvc);

	}

	/**
	 * @method btnWasClicked : function which manage what to do when the button was clicked
	 * @param  {...*} params : some arguments
	 */
	async btnWasClicked(params) {
		trace("Name saved is", params);
		this.mvc.model.name=params;//save the name into the model object of this client
		this.name=params;
		this.mvc.view.cleanStage(); 
		//await this.mvc.model.connect(params);// wait async request > response from server and update view table values
		this.mvc.model.validate(params);
	}

	/**
	 * @method ioStartGame : function which is called at the start of the game 
	 */
	ioStartGame(){
		this.mvc.view.setGameStage();
		this.mvc.view.drawGame();
		this.mvc.model.searchDataUpdate();
		this.mvc.view.loopGame();
	}

	/**
	 * @method valCon : function which tells if the name chosen by the player has been verified by the server 
	 * @param {*} packet : contains the food, the others, and value which is a boolean
	 */
	valCon(packet){
		//trace(packet);
		if(packet.value==1){
			//trace("Name is fine,game is starting.");
			this.mvc.view.food = packet.food;
			this.mvc.view.blobs = packet.others;
			this.ioStartGame();
		}else{
			//trace("Name not fine, try a new one.");
			alert("Your name is already taken or too long, only 6 characters maximum please");
			this.mvc.view.cleanStage();
			this.mvc.view.showStartWindow();
		}
	}

	/**
	 * @method updateWorldData : function which receive the world data from server and save them into the view so it can be displayed
	 * @param  {...*} data : contains a data.blob object and a data.other_blobs tab
	 */
	updateWorldData(data){
		if(data.blob.isAlive==true){
		
			this.mvc.model.blob.score = data.blob.score;
			this.mvc.view.blobs=data.other_blobs;
		}else{
			this.mvc.model.blob.score = data.blob.score;
			this.mvc.model.blob.name = data.blob.name;
			this.mvc.view.blobs=data.other_blobs;
			alert("You've been killed !");
			clearInterval(this.mvc.view.interval);
			this.mvc.view.cleanStage();
			this.mvc.view.showStartWindow();
		}
	}

	/**
	 * @method updateOnDisc : function which is called and a client leave the game so the other client are kept updated
	 * @param  {*} data : the tab of the others players updated
	 */
	updateOnDisc(data){
		this.mvc.view.blobs=data.other_blobs;
	}

	/**
	 * @method updateFoodData : function which update the food tab saved into the view so it can be correctly displayed
	 * @param  {*} data : data.food contains a food tab
	 */
	updateFoodData(data){
		this.mvc.view.food = data.food;
	}
}