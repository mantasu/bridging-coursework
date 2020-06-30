import Star from './star.js';

// Set up mouse object
const mouse = {
  x: undefined,
  y: undefined,
  radius: 90,
  wheel: 0,
}
window.addEventListener('mousemove', e => { mouse.x = e.x; mouse.y = e.y; });

// Select menu items
const carrousel = document.querySelector('#carrousel');
const posts = document.querySelectorAll('.post');
const post_btn = document.querySelectorAll('.post-btn');
const post_cnt = document.querySelectorAll('.post-cnt');

// Declare size constants
const finalGaps = 2;
const angleStep = 360 / (posts.length + finalGaps);
const positionZ = angleStep * .88;

// Declare helper functions (global)
function rotatePostTo(degrees, i) {
  let opacity = Math.cos(degrees * Math.PI / 180) < 0 ? (1 + Math.cos(degrees * Math.PI / 180)) / 3 : 1;
  posts[i].style.transform = `rotateX(${degrees}deg) translateZ(${positionZ}vh)`;
  posts[i].style.opacity = `${opacity}`;
}

function rotatePostTo0(index) {
  let angleToRotate = -(postAngles[index] % 360);
  if(Math.abs(angleToRotate) >= 180) angleToRotate += angleToRotate > 0? -360 : 360;

  posts.forEach((post, i) => {
    postAngles[i] += angleToRotate;
    rotatePostTo(postAngles[i], i);
  });
}

// Initialize button position
let postAngles = [];

posts.forEach((button, i) => {
  postAngles.push(-angleStep * i);
  rotatePostTo(postAngles[i], i);
});

// Add scroll event to get rotating menu functionality
function scroll(e) { mouse.wheel += e.deltaY;}
carrousel.addEventListener('wheel', scroll);



// Add click event to make the content expand when a button is clicked
let show = false;
posts.forEach((post, i) => {
  post.addEventListener('click', () => {
    if(show) {
      posts.forEach(btn => {btn.style.transition = "all 200ms cubic-bezier(.05,.73,.24,1.06)"; });
      post_cnt[i].classList.remove('show-cnt');
      carrousel.addEventListener('wheel', scroll);
      posts[i].style.transform = `translateZ(${positionZ}vh`;
      posts.forEach((btn, j) => { if(i != j) btn.style.pointerEvents = 'auto'; });
      post_btn.forEach((btn, j) => { if(i != j) btn.classList.add('show-btn'); });
    } else {
      posts.forEach(btn => {btn.style.transition = "all 200ms ease-out"; });
      rotatePostTo0(i);
      post_cnt[i].classList.add('show-cnt');
      carrousel.removeEventListener('wheel', scroll);
      posts[i].style.transform = 'translateZ(0)';
      posts.forEach((btn, j) => { if(i != j) btn.style.pointerEvents = 'none'; });
      post_btn.forEach((btn, j) => { if(i != j) btn.classList.remove('show-btn'); });
    }
    show = !show;
  });
});


/* CANVAS */
const canvas = document.querySelector('#stars');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let stars = [];

// Initialize stars
function initStars() {
  stars = [];
  let numOfStars = canvas.width * canvas.height * .0005;
  console.log(numOfStars);

  for(let i = 0; i < numOfStars; i++) {
    let x = Math.random() * canvas.width;
    let y = Math.random() * canvas.height;
    let radius = Math.random() + .5;

    stars.push(new Star(x, y, radius, canvas.width / 2, canvas.height / 2));
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if(Math.abs(mouse.wheel) > 0) {
    posts.forEach((post, i) => {
      postAngles[i] += mouse.wheel * 2;
      rotatePostTo(postAngles[i], i);
    });
  }

  stars.forEach(star => {
    star.update(mouse);
    star.draw(ctx);
  });
  
  mouse.wheel *= .8;
  if(Math.abs(mouse.wheel) < .01) mouse.wheel = 0;
}

// Resize event
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initStars();
});


initStars();
animate();