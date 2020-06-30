// Global values
let canvas, ctx, x0, y0, radius;

// Create line
export class Path {
  constructor(speed, acceleration, rotations, particleProps) {
    this.x = [-particleProps.radius, canvas.width + particleProps.radius];
    this.y = [y0, y0];
    this.angle = [0, Math.PI];
    this.initialSpeed = speed;
    this.speed = speed;
    this.acceleration = acceleration;
    this.rotations = rotations;
    this.particleProps = particleProps;
    this.particleArray = [[],[]];
    this.middleRange = Math.sqrt(Math.pow(radius, 2) 
                     - Math.pow(radius / 2, 2)) * 2;                  // Range between center and enter/exit point
    this.stageChecks = {entered: false, rotated: false};              // Entered : if it entered the circle | Rotated : if it finished rotating
    this.particleProps.dynamicPoints = [                              // Define custom size particle point arrays for the two clusters
      Array.from({length: particleProps.amount}, e => new Array(2)),
      Array.from({length: particleProps.amount}, e => new Array(2))
    ];
  }

  draw(clusterX, clusterY, which, angle, offset = -Math.PI / 2) {

    function rotatePoint(pointX, pointY, originX = 0, originY = 0, radians = angle + offset) {
      let x = Math.cos(radians) * (pointX-originX) - Math.sin(radians) * (pointY-originY) + originX;
      let y = Math.sin(radians) * (pointX-originX) + Math.cos(radians) * (pointY-originY) + originY;
      return [x, y];
    }

    function getRandom(a, b) {
      return Math.random() * (b - a) + a;
    }

    // For each particle in some (defined by which) cluster
    for(let i = 0; i < this.particleProps.amount; i++) {

      // Generate spawnpoint in front of the cluster
      let spawnpointX = getRandom(-this.particleProps.radius, this.particleProps.radius);
      let spawnpointY = -Math.pow(spawnpointX, 2) / (this.particleProps.radius * .8) + this.particleProps.radius;

      // Generate direction vectors for the particle to move
      let vectorX = getRandom(this.particleProps.vectorX[0], this.particleProps.vectorX[1]);  
      let vectorY = getRandom(this.particleProps.vectorY[0], this.particleProps.vectorY[1]);

      // Rotate the points by cluster angle
      let spawnpoint = rotatePoint(spawnpointX + clusterX, spawnpointY + clusterY, clusterX, clusterY);
      let vector = rotatePoint(vectorX, vectorY);

      // Assign the properties to the array to use them later for particle generation
      this.particleProps.dynamicPoints[which][i][0] = spawnpoint;
      this.particleProps.dynamicPoints[which][i][1] = vector;
    }
  }

  update() {
    // Performing checks only on 1 cluster because the 2nd one follows synchronically

    // If within enter-exit area of the circle
    if(this.x[0] > x0 - this.middleRange && this.x[0] < x0 + this.middleRange) {
      if(!this.stageChecks.entered) this.enter_exit(true);
      else if(!this.stageChecks.rotated) this.rotate();
      else this.enter_exit(false);
    }
    // If outside view area
    else if(this.x[0] > canvas.width + radius) {
      this.x = [-this.particleProps.radius, canvas.width + this.particleProps.radius];
      this.y = [y0, y0];
      this.angle = [0, Math.PI];
      this.speed = this.initialSpeed;
      this.stageChecks = {entered: false, rotated: false};
    }
    // If in main line
    else {
      this.speed += this.rotated ? -this.acceleration * (this.rotations * Math.PI * 2) : this.acceleration / 2;
      if(this.speed < this.initialSpeed) this.speed = this.initialSpeed;
      this.x[0] += this.speed;
      this.x[1] -= this.speed;
      this.draw(this.x[0], this.y[0], 0, 0);
      this.draw(this.x[1], this.y[1], 1, -Math.PI);
    }

    // For each cluster
    for(let i = 0; i < this.particleArray.length; i++) {
      // Update each particle absolutePosition and remove a particle if its size is 0
      for(let j = 0; j < this.particleArray[i].length; j++) {
        if(this.particleArray[i][j].update()) {
          this.particleArray[i].splice(j, 1);
        }
      }
      // Create a new array of particles
      for(let j = 0; j < this.particleProps.amount; j++) {
        let size = Math.random() * this.particleProps.size * (radius * .001) + this.particleProps.size * (radius * .0005);
        let color = this.particleProps.color;
        let lifespan = this.particleProps.lifespan;

        let spawnpoint = this.particleProps.dynamicPoints[i][j][0];
        let vector = this.particleProps.dynamicPoints[i][j][1];

        this.particleArray[i].push(new Particle(spawnpoint, vector, size, color, lifespan));
      }
    }
  }

  enter_exit(enter) {
    this.speed -= this.acceleration;
    if(this.speed < this.initialSpeed) this.speed = this.initialSpeed;
    
    let arcLenght = (Math.PI / 3) * radius;
    let angleStep = (Math.PI / 3) / (arcLenght / this.speed);

    this.angle[0] += angleStep;
    this.angle[1] += angleStep;

    let centerX = [];
    centerX[0] = enter ? (x0 - this.middleRange) : (x0 + this.middleRange);
    centerX[1] = enter ? (x0 + this.middleRange) : (x0 - this.middleRange);

    this.x[0] = Math.sin(this.angle[0]) * radius + centerX[0];
    this.y[0] = Math.cos(this.angle[0]) * radius + (y0 - radius);
    this.x[1] = Math.sin(this.angle[1]) * radius + centerX[1];
    this.y[1] = Math.cos(this.angle[1]) * radius + (y0 + radius);
    
    this.draw(this.x[0], this.y[0], 0, -this.angle[0]);
    this.draw(this.x[1], this.y[1], 1, -this.angle[1]);
    
    if(this.x[0] >= x0 - this.middleRange * .5 && enter) {
      this.angle[0] = Math.PI / 6;
      this.angle[1] = Math.PI / 6 + Math.PI;
      this.stageChecks.entered = true;
    }
  }

  rotate(offset = -Math.PI) {
    this.speed += this.acceleration;

    let circleLenght =  Math.PI * 2 * radius;
    let angleStep = Math.PI * 2 / (circleLenght / this.speed);

    this.angle[0] += angleStep;
    this.angle[1] += angleStep;

    this.x[0] = Math.cos(this.angle[0] + offset) * radius + x0;
    this.y[0] = Math.sin(this.angle[0] + offset) * radius + y0;
    this.x[1] = Math.cos(this.angle[1] + offset) * radius + x0;
    this.y[1] = Math.sin(this.angle[1] + offset) * radius + y0;

    this.draw(this.x[0], this.y[0], 0, this.angle[0], offset);
    this.draw(this.x[1], this.y[1], 1, this.angle[1], offset);

    if(this.angle[0] + Math.PI / 6 >= this.rotations * Math.PI * 2) {
      this.angle[0] = -Math.PI / 3;
      this.angle[1] = -Math.PI / 3 + Math.PI;
      this.stageChecks.rotated = true;
    }
  }
}

class Particle {
  constructor(spawnpoint, vector, size, color, lifespan) {
    this.x = spawnpoint[0];
    this.y = spawnpoint[1];
    this.vectorX = vector[0];
    this.vectorY = vector[1];
    this.size = size;
    this.color = color;
    this.lifespan = 10 / lifespan;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  update() {
    this.x += this.vectorX;
    this.y += this.vectorY;

    this.size -= this.lifespan;

    if(this.size < 0) this.size = 0;
    if(this.size === 0) return true;

    this.draw();

    return false;
  }
}

export function setLocal(a, b, c, d, e) {
  canvas = a;
  ctx = b;
  x0 = c;
  y0 = d;
  radius = e;
}