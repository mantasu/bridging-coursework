export default class Star {
  constructor(x, y, radius, x0, y0) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.x0 = x0;
    this.y0 = y0;

    this.luminocity = Math.random() * .3 + .7;
    this.brightness = Math.random() * .008 + .002;

    this.angle = Math.atan2(y - y0, x - x0);

    this.baseX = x;
    this.baseY = y;

    let spawnRadius = Math.random() * Math.hypot(x - x0, y - y0);
    this.spawnX = Math.cos(this.angle) * spawnRadius + this.x0;
    this.spawnY = Math.sin(this.angle) * spawnRadius + this.y0;

    this.direction = true;  // true - forwards | false - backwards

    this.deltaX = 0;
    this.deltaY = 0;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${Math.floor(Math.random() * 55) + 200}, ${Math.floor(Math.random() * 55) + 200}, ${Math.floor(Math.random() * 55) + 200}, ${this.luminocity})`;
    ctx.fill();
    ctx.closePath();
  }

  update(mouse) {
    // Update luminocity
    const addBrightness = () => this.luminocity += this.brightness;
    addBrightness();

    if(this.luminocity > 1) {
      this.brightness = -Math.abs(this.brightness);
      addBrightness();
    } else if(this.luminocity < .15) {
      this.brightness = Math.abs(this.brightness);
      addBrightness();
    }

    // Update speed
    let baseSpeed = this.radius * Math.hypot(this.baseX - this.x0, this.baseY - this.y0) * .0003;
    let speed = baseSpeed;
    speed *= mouse.wheel != 0? mouse.wheel * 10 : 1;
    this.speedX = Math.cos(this.angle) * speed;
    this.speedY = Math.sin(this.angle) * speed;

    this.baseX += this.speedX;
    this.baseY += this.speedY;

    this.direction = mouse.wheel < 0 ? false : true;

    if(this.direction) { // If forwards
      if(this.baseX < 0 || this.baseX > this.x0 * 2 || this.baseY < 0 || this.baseY > this.y0 * 2) {  // If out of screen, reset spawnpoint and respawn
        let radius = Math.random() * this.x0 * .95 + this.x0 * .05;
        this.baseX = Math.cos(this.angle) * radius + this.x0;
        this.baseY = Math.sin(this.angle) * radius + this.y0;
        this.spawnX = this.baseX;
        this.spawnY = this.baseY;
        this.luminocity = .1;
      }
    } else {  // If backwards
      if(Math.hypot(this.baseX - this.x0, this.baseY - this.y0) < Math.hypot(this.spawnX - this.x0, this.spawnY - this.y0)) { // If behind spawnpoint reset it and spawn out of screen
        let radius = Math.random() * this.x0 * .95 + this.x0 * .05;
        this.spawnX = Math.cos(this.angle) * radius + this.x0;
        this.spawnY = Math.sin(this.angle) * radius + this.y0;
        this.baseX = this.spawnX;
        this.baseY = this.spawnY;

        while(this.baseX > 0 && this.baseX < this.x0 * 2 && this.baseY > 0 && this.baseY < this.y0 * 2) {
          this.baseX += Math.cos(this.angle) * 5;
          this.baseY += Math.sin(this.angle) * 5;
        }
      }  
    }

    this.x = this.baseX;
    this.y = this.baseY;
    

    // Update position based on mouse position
    if(mouse.x && mouse.y) {
      this.x += (this.x0 - mouse.x) / this.x0 * Math.pow(baseSpeed, 2) * 300;
      this.y += (this.y0 - mouse.y) / this.y0 * Math.pow(baseSpeed, 2) * 300;
    }

    

    // Pointer interaction within mouse radius
    /*
     * distance[x, y] - distance from star center to cursor
     * force[x, y] - inverse proportion of distance to bounder (i.e. the closer it is to bounder, the lower the force is). 
       Bounder in this case is the size of mouse.radius. The bigger and closer to cursor the star is, the greater force it will get.
    */
    this.x += this.deltaX;
    this.y += this.deltaY;

    let distance = Math.hypot(mouse.x - this.x, mouse.y - this.y);

    // If within mouse radius
    if(distance < mouse.radius) {
      let force = (mouse.radius - distance) / mouse.radius * this.radius * 5;
      force = [(mouse.x - this.x) / distance * force, (mouse.y - this.y) / distance * force];
      this.deltaX -= force[0];
      this.deltaY -= force[1];
    } else {
      this.deltaX *= .98;
      this.deltaY *= .98;
      if(Math.abs(this.deltaX) < .1) this.deltaX = 0;
      if(Math.abs(this.deltaY) < .1) this.deltaY = 0;
    }
  }
}