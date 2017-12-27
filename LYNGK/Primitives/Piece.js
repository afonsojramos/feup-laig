/**
 * Piece
 * @param gl {WebGLRenderingContext}
 * @constructor
 */
function Piece(scene, line, column, height, color) {
	CGFobject.call(this, scene);

	this.scene = scene;

	this.part1 = new Cylinder(this.scene, 0.8, 2.5, 2, 50, 50);
	this.part2 = new Cylinder(this.scene, -0.5, 2.8, 2, 50, 50);
	this.part3 = new Cylinder(this.scene, 1, 3.3, 3.3, 50, 50);
	this.part4 = new Cylinder(this.scene, 0, 3.3, 2.8, 50, 50);
	this.part5 = new Cylinder(this.scene, 0, 2, 0, 50, 50);
	this.part6 = new Cylinder(this.scene, 0, 3.3, 0, 50, 50);

	this.line = line || 0;
	this.column = column || 0;
	this.height = height || 0;
	this.color = color || "noColor";
	//for shaders
	this.picked = false;
	this.possible = false;

	this.id = ++Piece.id;

	this.scene.colorMaterial = new CGFappearance(this.scene);
	this.scene.colorMaterial.setAmbient(0.5, 0.5, 0, 1);
	this.scene.colorMaterial.setDiffuse(1, 0, 0, 1);
	this.scene.colorMaterial.setSpecular(0.34, 0.32, 0.17, 1);
	this.scene.colorMaterial.setShininess(10);

}
Piece.id = 0;
//scale factor from prolog coordinates into the board size
Piece.factors = {
	y: 1,
	x: 3.9,
	z: 2.25
};
//where does the board start
Piece.boardStart = {
	x: 9.5,
	y: 0.5,
	z: 10.5
};
Piece.prototype = Object.create(CGFobject.prototype);
Piece.prototype.constructor = Piece;

Piece.prototype.display = function () {
	this.setColor();
	if (this.picked) this.scene.setActiveShader(this.scene.pickedShader);
	else if (this.possible) this.scene.setActiveShader(this.scene.possibleShader);
	this.scene.registerForPick(this.id, this);
	this.scene.translate(
		Piece.factors.x * this.column + Piece.boardStart.x,
		Piece.factors.y * this.height + Piece.boardStart.y,
		Piece.factors.z * this.line + Piece.boardStart.z);
	this.scene.scale(0.45, 0.45, 0.45);
	this.scene.rotate(Math.PI / 2, -1, 0, 0);

	this.scene.pushMatrix();
	this.scene.translate(0, 0, 0.2);
	this.part1.display();
	this.scene.popMatrix();

	this.scene.pushMatrix();
	this.scene.translate(0, 0, 1);
	this.part2.display();
	this.part4.display();
	this.part5.display();
	this.scene.popMatrix();

	this.part3.display();

	this.scene.pushMatrix();
	this.scene.rotate(Math.PI, 0, 1, 0);
	this.part6.display();
	this.scene.popMatrix();
	if (this.picked || this.possible) this.scene.setActiveShader(this.scene.defaultShader);
};

Piece.prototype.setColor = function () {
	if (this.color == "wild")
		this.scene.wildMaterial.apply();
	else if (this.color == "blue")
		this.scene.blueMaterial.apply();
	else if (this.color == "green")
		this.scene.greenMaterial.apply();
	else if (this.color == "black")
		this.scene.blackMaterial.apply();
	else if (this.color == "red")
		this.scene.redMaterial.apply();
	else if (this.color == "ivory")
		this.scene.ivoryMaterial.apply();
};