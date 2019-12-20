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
		this.io.on("con_re", packet => this.onConnectData(packet)); // listen to "con_re" messages
	}


	/**
	 * @method onConnectData : con_re data received from io server
	 * @param {Object} data 
	 */
	onConnectData(data) {
		trace("Please choose a name");
		//this.mvc.controller.ioStartGame(data); // send it to controller
	}
}

class MyModel extends Model {
	name;
	id;
	io;
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

}

class MyView extends View {

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

	showMenu(){
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

				this.activate();

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
		this.getBtnHandler = e => this.btnClick(e);
		this.btn.addEventListener("click", this.getBtnHandler);
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

	prepareStage(){

		 while (this.stage.firstChild) {
    		this.stage.removeChild(this.stage.firstChild);
  		}
	}

	setGameStage(data){

		trace(data);
		this.txt= document.createElement("input");
		this.txt.setAttribute("type", "text");
		this.txt.setAttribute("value" , data);
		this.stage.appendChild(this.txt);

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
		this.mvc.view.prepareStage(); 
		//await this.mvc.model.connect(params);// wait async request > response from server and update view table values
		this.mvc.model.validate(params);
	}

	ioStartGame(data){
		trace(data);
		//this.
		this.mvc.view.setGameStage(data);
	}

	valCon(packet){
		trace(packet.value);
		if(packet.value==1){
			trace("Name is fine,game is starting.");
			this.ioStartGame(this.name);
		}else{
			trace("Name not fine, try a new one.");
			this.mvc.view.prepareStage();
			this.mvc.view.showMenu();
		}
	}

}