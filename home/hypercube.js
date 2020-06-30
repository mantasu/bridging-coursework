// Returns a dot product of 2 matrixes
// If the second parameter is a coordinate, it can be converted to N*1 matrix
function matrixDot (A, B, isCoordinateB = false) {
  if(isCoordinateB) B = new Array(B.length).fill(0).map((row, i) => [B[i]]);
  
  let result = new Array(A.length).fill(0).map(row => new Array(B[0].length).fill(0));
  result = result.map((row, i) => row.map((col, j) => A[i].reduce((sum, elm, k) => sum + (elm*B[k][j]), 0)));

  if(isCoordinateB) result = [].concat(...result);

  return result;
}


export default class Hypercube {
  /* PARAMS
   * dimension (int) - type (dimension) of hypercube
   * size (double) - absolute size in pixels. The relative size depends on a position too
   * absolutePosition (double[]) - where the cube is located in a specific axis relative to the whole area
   * relativePosition (double[]) - where the cube is located in a specific axis relative to its absolute position
   * vanishing (boolean) - whether it has a vanishing point (aka perspective);
   * 
   * vertices (int[double[]]) - n vertices with points in k axes
   * nodeSize (int[int, double, double]) - key-value pairs of a node number and 2 size values
   * projections (int[double[x, y]]) - n vertices with points in x & y axes 
  */

  /* RESTRICTS
   * size > 0
   * absolutePosition has a value for each dimension
   * each >2D value in absolutePosition cannot be lower than size * 1.8 for proper perspective rendering
  */
  constructor(dimension, size, absolutePosition, relativePosition = new Array(absolutePosition.length).fill(0), vanishing = true) {
    this.size = size;
    this.dimension = dimension;
    this.vanishing = vanishing;
    this.absolutePosition = absolutePosition;
    this.relativePosition = relativePosition;

    this.vertices = new Array(Math.pow(2, dimension));
    this.nodeSize = new Array(Math.pow(2, dimension));
    this.projections = new Array(this.vertices.length);
    
    this.generateVertices();
  }

  // Generates all the vertices around the relative position
  /* SPECS
   * This is the similar to generating a truth table for n amount of premises
   * Position offset for vertices is specified in each axis it exists
   * For other extra axes (if it has any), there is no position offset
   * Position offset depends on size and is relative to the relativePosition
  */
  generateVertices() {
    for(let i = 0; i < this.vertices.length; i++) {
      let vertice = [];
  
      for(let j = 0; j < this.relativePosition.length; j++) {
        let divider = Math.pow(2, j+1) / 2;
        let plus_minus = Math.floor(i / divider) % 2 ? 1 : -1;
        if(j >= this.dimension) plus_minus = 0;
  
        vertice.push(this.relativePosition[j] + this.size * plus_minus);
      }
      this.vertices[i] = vertice;
    }
    this.unrotatedVertices = this.vertices.slice();
  }

  // Projects the hypercube's vertices to 2D
  // Reccomended perspective is acquired when absolute position for every axis that is >2D is twice the size of the hypercube
  // Go through each specified position in some dimension
  // We map through each vertice in some dimension and reduce it to a lower dimension (until 2D)
  // By default distances in one side of the axis are twice as small as in the other
        // We create a projection matrix which will reduce vertice.length by 1 by removing the last coordinate in i dimension
        // but give a proper projection for the other coordinates in the remaining axes. 
        // This keeps every node, they only appear further or closer in the lower dimension
        // When we reach 3D, we need to assign correct sizes for each node depending on Z axis
        // This creates a better perspective (which results in proper 3D illusion) on a 2D screen
        // By default nodes in one side of the axis are twice as small as in the other
  project() {
    this.projections = this.vertices.slice();
    this.nodeSize = this.nodeSize.fill().map(() => []);
    
    if(this.dimension < 3 && this.vertices[0].length < 3) {
      for(let i = this.vertices[0].length; i < 3; i++) {
        this.relativePosition.push(0);
      }
      this.generateVertices();
    }
    
    for(let i = this.relativePosition.length - 1; i > 1 ; i--) {   
      this.projections = this.projections.map((vertice, j) => {
        let perspective = this.vanishing && this.absolutePosition[i] > 0 ? this.size * 2 / (this.absolutePosition[i] * 1.5 - vertice[i]) : 1;
        let projection = new Array(i).fill().map((row, r) => new Array(i).fill().map((col, c) => r == c ? perspective : 0));
        
        if(i == 2) {
          let radius = Math.hypot(this.size, this.size);
          let size = (vertice[i] + radius) / (2 * radius) * .5 + .5; 

          this.nodeSize[j][0] = j;
          this.nodeSize[j][1] = this.vanishing ? size : 1;
          this.nodeSize[j][2] = this.vanishing ? perspective : 1;
        }
        return matrixDot(projection, vertice, true); 
      });
    }
  }

  // Must come in the following order: args([xy],[zx, zy],[wx, wy, wz],...)
  // Using SO(n) for "basic" (n-choose-2) rotation
  // Make sure position for each axis is specified for each rotation dimension
  rotate(rotationSets, rotateAxes = false) {
    if(rotationSets.length < 2 || rotationSets.length + 1 < this.relativePosition.length) {
      for(let i = rotationSets.length; i < 2; i++) rotationSets.push(new Array(i+1).fill(0));
      for(let i = rotationSets.length; i < this.relativePosition.length; i++) rotationSets.push(new Array(i+1).fill(0));
    }
    if(this.vertices[0].length < rotationSets.length + 1) {
      for(let i = this.vertices[0].length; i < rotationSets.length + 1; i++) this.relativePosition.push(0);
      this.generateVertices();
    }

    let direction = [];
    
    for(let i = 0; i < rotationSets.length; i++) {
      for(let len = rotationSets[i].length, j = len - 1; j >= 0; j--) {
          
        let len = rotationSets[i].length;
        let cos = Math.cos(rotationSets[i][j]);
        let sin = Math.sin(rotationSets[i][j]);        

        let rotation = new Array(rotationSets.length + 1).fill().map((row, r) => 
        new Array(rotationSets.length + 1).fill().map((col, c) => r == c ? 1 : 0));
          
        rotation[len][len] = cos;
        rotation[len][j] = -sin;
        rotation[j][len] = sin;
        rotation[j][j] = cos;
          
        direction.push(rotation);
      }
    }
    
    if(rotateAxes) this.vertices = this.unrotatedVertices.slice();
    direction.forEach(rotation => { this.vertices = this.vertices.map(vertice => matrixDot(rotation, vertice, true)); });
  }

  // Drawing points for each vertice
  draw(ctx) {
    this.project();

    function addEdge(a, b) { edges[a].push(b); edges[b].push(a); }
    function removeEdge(a, b) { edges[a].splice(edges[a].indexOf(b), 1); edges[b].splice(edges[b].indexOf(a), 1);}

    let edges = {};
    this.vertices.forEach((vertice, i) => edges[i] = []);

    for(let i = 0; i < this.dimension; i++) {
      let index1 = -1 - Math.pow(2, i), index2;

      for(let j = 0; j < this.vertices.length * .5; j++) {
        index1++;
        if(!(j % Math.pow(2, i))) index1 += Math.pow(2, i);
        index2 = index1 + Math.pow(2, i);

        addEdge(index1, index2);
      }
    }

    let ascendingSizes = this.nodeSize.slice().sort((a, b) => a[1] - b[1]);

    ascendingSizes.forEach(node => {
      let start = node[0];
      let edgesToRemove = [];

      edges[start].forEach(end => {
        ctx.beginPath();
        ctx.moveTo(this.projections[start][0] + this.absolutePosition[0], this.projections[start][1] + this.absolutePosition[1]);
        ctx.lineTo(this.projections[end][0] + this.absolutePosition[0], this.projections[end][1] + this.absolutePosition[1]);

        let sizeConstant = Math.hypot(this.size, this.size) / 400;
        let axisConstant = Math.pow(1 / this.dimension * 4, this.dimension * .7);
        let positionConstant = (this.nodeSize[start][2] + this.nodeSize[end][2]) * .5;
        let perspectiveConstant = (this.nodeSize[start][1] + this.nodeSize[end][1]) * .5;
        let constant = sizeConstant * axisConstant * positionConstant * perspectiveConstant;

        let rgb = 230 * perspectiveConstant;
        rgb = [Math.floor(rgb*.3), Math.floor(rgb*.6), Math.floor(rgb)];

        ctx.lineWidth = 25 * constant;
        ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${perspectiveConstant})`;
        ctx.stroke();

        edgesToRemove.push(end);
      });
      edgesToRemove.forEach(end => removeEdge(start, end));
      ctx.beginPath();

      let sizeConstant = Math.hypot(this.size, this.size) / 400;
      let axisConstant = Math.pow(1 / this.dimension * 4, this.dimension * .7);
      let positionConstant = this.nodeSize[start][2];
      let perspectiveConstant = this.nodeSize[start][1];
      let constant = sizeConstant * axisConstant * positionConstant * perspectiveConstant;

      let rgb = 240 * perspectiveConstant < 100 ? 100 : 240 * perspectiveConstant;
      rgb = [Math.floor(rgb*.3), Math.floor(rgb*.9), Math.floor(rgb)];
      let arcSize = 30 * constant;

      ctx.arc(this.projections[start][0] + this.absolutePosition[0], this.projections[start][1] + this.absolutePosition[1], arcSize, 0, Math.PI * 2, false);
      ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${perspectiveConstant})`;
      ctx.fill();
    });
  }

  setSize(size) {
    this.size = size;
    this.generateVertices();
  }
  setAbsolutePosition(absolutePosition, i) {
    this.absolutePosition[i] = absolutePosition;
  }
}