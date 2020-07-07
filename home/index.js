import Hypercube from "./hypercube.js";
import { Path, setLocal } from "./particles.js"; 


/* CSS */
// MENU
const menu = document.querySelector('#menu');
const hypermenu = document.querySelector('#hypermenu');


// BUTTON
let spans = document.querySelectorAll('.btn span');

let spanPositionIncreasement = 2;
let spanDelayIncreasement = .05;

spans.forEach( (span, i) => {
  span.style.left = `${i * spanPositionIncreasement}em`;
  span.style.transitionDelay = `${ Math.abs(i - Math.floor(spans.length/2)) * spanDelayIncreasement}s`;
});

spans[0].style.borderRadius = "25px 0 0 25px";
spans[spans.length - 1].style.borderRadius = "0 25px 25px 0";

// SQUARES
const PARTICLE_DURATION = 2000;
const PARTICLE_AMOUNT = 20;

let timeStep = PARTICLE_DURATION / PARTICLE_AMOUNT;
let overlay = document.querySelector('#overlay');

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generating squares
for(let i = 0; i < PARTICLE_AMOUNT; i++) {
  let square = document.createElement('div');
  square.className = 'square';

  // Position
  let x = Math.random() < .5 ? -51 : 51;
  let y = randomInt(-51, 52);

  if(Math.random() < .5) y = [x, x = y][0];

  // Rotation (a - alpha | b - beta)
  let a = Math.random() < .5 ? randomInt(120, 180) : randomInt(-180, -120);
  let b = Math.random() < .5 ? randomInt(120, 180) : randomInt(-180, -120);

  let rotateX = `rotateX(${a}deg)`;
  let rotateY = `rotateY(${b}deg)`;

  Math.random() < .5 ? rotateX = `rotate(${a}deg)` : rotateY = `rotate(${b}deg)`;
  
  // One particle animation
  square.animate([
    {transform: `scale(1.5) translate(${x}vw, ${y}vh) rotateX(0) rotateY(0)`, opacity: 1,},
    {transform: `scale(.5) translate(0, 0) ${rotateX} ${rotateY}`, opacity: 0},
  ], {
    duration: PARTICLE_DURATION,
    delay: i*timeStep,
    endDelay: i*timeStep,
    easing: "cubic-bezier(.07,.48,.88,.49)",
    iterations: Infinity,
  });

  overlay.insertBefore(square, menu);
}

/* ELEMENTS */

/* CANVAS */
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

let pointer = {x:0, y:0};

let path, hypercube;
let x0, y0, radius, sizeConst;
let aPos, rPos, rots;




function init() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  x0 = canvas.width * .5;
  y0 = canvas.height * .75;
  radius = (canvas.height - y0) / 1.5;
  sizeConst = radius * 1.2 / 50;

  initParticles();
  initHypercube();
}

/* PARTICLES */
function initParticles() {
  let lagReducer1 = Math.ceil(3200 / (canvas.height));
  let lagReducer2 = Math.ceil(1800 / (canvas.width));
  let lagReducer = (canvas.width > 1500) || (canvas.width > 1200 && canvas.height > 820) ? lagReducer2 : lagReducer1;

  let particleProps = {
    amount: lagReducer > 10 ? 10 : lagReducer,
    size: 75,
    color: 'rgba(50,50,255,.7)',
    lifespan: 75,
    radius: 15,               // Cluster radius
    vectorX: [-.4, .4],       // [min, max] range where a particle can move in X direction
    vectorY: [-.7, -.1],      // [min, max] range where a particle can move in Y direction
  }

  setLocal(canvas, ctx, x0, y0, radius);

  path = new Path(10 / lagReducer, 1 / lagReducer, 8.5, particleProps);
  path.update();
}



/* HYPERMENU */

let isHypermenu = false;
window.addEventListener('dblclick', (e) => {
  let distanceToCenter = Math.hypot(e.pageX - x0, e.pageY - y0);

  if(distanceToCenter <= radius * .75 && !isHypermenu) {
    menu.style.transform = 'rotateY(180deg)';
    hypermenu.style.transform = 'rotateY(360deg)';
    isHypermenu = true;
  } else if(distanceToCenter <= radius * .75) {
    menu.style.transform = 'rotateY(0deg)';
    hypermenu.style.transform = 'rotateY(180deg)';
    isHypermenu = false;
    stopUpdate = false;
  }
});




// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  ctx.clearRect(0, 0, innerWidth, innerHeight);

  if(!isHypermenu) path.update();
  
  //hypercube.rotate([0],[pointer.y * .0001, pointer.x * .0001 + .01],[0,.01,0]);

  let anglesToRotate = findDeltaAndReset();
  if(abRotation.checked) anglesToRotate = rots.new.slice();

  if(slowDown) {
    pointer.x = Math.abs(pointer.x) <= 1 ? 0 : pointer.x * .9;
    pointer.y = Math.abs(pointer.y) <= 1 ? 0 : pointer.y * .9;
  }
  anglesToRotate[1][0] += pointer.x * .0001;
  anglesToRotate[1][1] += pointer.y * .0001;

  abRotation.checked ? hypercube.rotate(anglesToRotate, true) : hypercube.rotate(anglesToRotate);
  
  hypercube.draw(ctx);
}




init();

/* HYPERCUBE */
function initHypercube() {
  let size = document.querySelector('#size input');
  size = size.value * sizeConst;
  aPos = [x0, y0, size * 3, size * 2.5]
  rPos = [0, 0, 0, 0];
  rots = {
    old: [[0], [0, 0], [0, 0, 0]],
    new: [[0], [0, 0], [0, 0, 0]],
  };
  hypercube = new Hypercube(4, size, aPos, rPos);
}




// Add functionality to dimension and size changes
function selectStaticInputs() {
  sizeSlider = document.querySelector('#size input');
  dimensionInput = document.querySelector('#dimension input');
  viewSize = document.querySelector('#view-size');

  function autoPosition(slider, i) {
    if(auto[i].checked) {
      slider.value = i+1 <= dimensionInput.value ? i % 2 ? sizeSlider.value * 2.5 : sizeSlider.value * 3 : sizeSlider.value * 1.3;
      aPos[i] = slider.value * sizeConst * getDC();
      hypercube.setAbsolutePosition(aPos[i], i);
    }
  }

  sizeSlider.addEventListener('change', () => {
    hypercube.setSize(sizeSlider.value * sizeConst * getDC());
    aPosSliders.forEach((slider, i) => {if(i > 1) autoPosition(slider, i)});
  });
  sizeSlider.addEventListener('mousedown', () => { sizeSlider.clicked = true; });
  sizeSlider.addEventListener('mouseup', () => { sizeSlider.clicked = false; viewSize.innerText = "Size";});
  sizeSlider.addEventListener('mousemove', () => {
    if(sizeSlider.clicked) {
      hypercube.setSize(sizeSlider.value * sizeConst * getDC());
      aPosSliders.forEach((slider, i) => {if(i > 1) autoPosition(slider, i)});
      viewSize.innerText = sizeSlider.value;
    }
  });
  sizeSlider.addEventListener('dblclick', () => {
    sizeSlider.value = 40;
    hypercube.setSize(sizeSlider.value * sizeConst * getDC());
    aPosSliders.forEach((slider, i) => {if(i > 1) autoPosition(slider, i)});
  });

  dimensionInput.addEventListener('change', () => {
    while(dimensionInput.value > aPos.length) {
      addPositionRow();
      addRotationRows();
    }
    if (dimensionInput.value <= aPos.length && dimensionInput.value > 2){
      aPosSliders[dimensionInput.value - 1].value = dimensionInput.value % 2 ? sizeSlider.value * 3 : sizeSlider.value * 2.5;
      aPos[dimensionInput.value - 1] = aPosSliders[dimensionInput.value - 1].value * sizeConst * getDC();
    }
    aPosSliders.forEach((slider, i) => {
      if(i > 1) {
        if(i+1 > dimensionInput.value) { if(auto[i].checked) { slider.value = sizeSlider.value * 1.3; }}
        aPos[i] = slider.value * sizeConst * getDC();
      }
    });
    hypercube = new Hypercube(dimensionInput.value, sizeSlider.value * sizeConst * getDC(), aPos.slice(), rPos.slice());
  });
}
let sizeSlider, dimensionInput, viewSize;
let getDC = () => Math.pow(2, dimensionInput.value) / 16  // dimension constant
selectStaticInputs();


// Add functionality to position table input changes
function selectPositionInputs() {
  auto = document.querySelectorAll('#positions tr td:nth-child(2) input');
  aPosSliders = document.querySelectorAll('#positions tr td:nth-child(3) input');
  rPosSliders = document.querySelectorAll('#positions tr td:nth-child(4) input');
  viewApos = document.querySelector('#view-apos');
  viewRpos = document.querySelector('#view-rpos');

  aPosSliders.forEach((slider , i) => {
    slider.addEventListener('change', () => {
      if(i == 0) {
        aPos[i] = canvas.width * slider.value / 1000;
        hypercube.setAbsolutePosition(aPos[i], i);
      } else if(i == 1) {
        aPos[i] = canvas.height * slider.value / 1000;
        hypercube.setAbsolutePosition(aPos[i], i);
      } else {
        aPos[i] = slider.value * sizeConst * getDC();
        hypercube.setAbsolutePosition(aPos[i], i);
      }
    });
    slider.addEventListener('mousedown', () => { slider.clicked = true; });
    slider.addEventListener('mouseup', () => { slider.clicked = false; viewApos.innerHTML = "Absolute position";});
    slider.addEventListener('mousemove', () => {
      if(slider.clicked) {
        if(i == 0) {
          aPos[i] = canvas.width * slider.value / 1000;
          hypercube.setAbsolutePosition(aPos[i], i);
        } else if(i == 1) {
          aPos[i] = canvas.height * slider.value / 1000;
          hypercube.setAbsolutePosition(aPos[i], i);
        } else {
          aPos[i] = slider.value * sizeConst * getDC();
          hypercube.setAbsolutePosition(aPos[i], i);
        }
        viewApos.innerHTML = slider.value;
      }
    });
  });
  rPosSliders.forEach((slider , i) => {
    slider.addEventListener('change', () => {
      if(i == 0) {
        rPos[i] = canvas.width * slider.value / 1000;
      } else if(i == 1) {
        rPos[i] = canvas.height * slider.value / 1000;
      } else {
        rPos[i] = slider.value * sizeConst * getDC();
      }
      hypercube = new Hypercube(dimensionInput.value, sizeSlider.value * sizeConst * getDC(), aPos.slice(), rPos.slice());
    });
    slider.addEventListener('mousedown', () => { slider.clicked = true; });
    slider.addEventListener('mouseup', () => { slider.clicked = false; viewRpos.innerHTML = "Relative position"; });
    slider.addEventListener('mousemove', () => {
      if(slider.clicked) {
        if(i == 0) {
          rPos[i] = canvas.width * slider.value / 1000;
        } else if(i == 1) {
          rPos[i] = canvas.height * slider.value / 1000;
        } else {
          rPos[i] = slider.value * sizeConst * getDC();
        }
        hypercube = new Hypercube(dimensionInput.value, sizeSlider.value * sizeConst * getDC(), aPos.slice(), rPos.slice());
        viewRpos.innerHTML = slider.value;
      }
    });
    slider.addEventListener('dblclick', () => {
      rPosSliders[i].value = 0;
      rPos[i] = 0;
      hypercube = new Hypercube(dimensionInput.value, sizeSlider.value * sizeConst * getDC(), aPos.slice(), rPos.slice());
    });
  });
  auto.forEach((checkbox, i) => {
    checkbox.addEventListener('change', () => {
      if(checkbox.checked) {
        aPosSliders[i].disabled = true;
        aPosSliders[i].value = i == 0 ? 500 : i == 1 ? 750 : i+1 <= dimensionInput.value ? i % 2 ? sizeSlider.value * 2.5 : sizeSlider.value * 3 : sizeSlider.value * 1.3;
        if(i == 0) {
          hypercube.setAbsolutePosition(canvas.width * .5, i);
        } else if(i == 1) {
          hypercube.setAbsolutePosition(canvas.height * .75, i);
        } else {
          hypercube.setAbsolutePosition(aPosSliders[i].value * sizeConst * getDC(), i);
        }
      } else {
        aPosSliders[i].disabled = false;
      }
    });
  });
}
let auto, aPosSliders, rPosSliders, viewApos, viewRpos;
selectPositionInputs();


// Add functionality to rotation table input changes
function selectRotationInputs() {
  abRotation = document.querySelector('#absolute-rotation');
  rotSliders = document.querySelectorAll('#rotations .slider input');
  continuous = document.querySelectorAll('#rotations .checkbox input');
  viewRot = document.querySelector('#view-rot');

  abRotation.addEventListener('change', () => {
    if(abRotation.checked) { rots.new = rots.new.map(array => array.map(angle => 0)); }
  });
  rotSliders.forEach((slider, i) => {
    slider.addEventListener('change', () => {
      if(!continuous[i].checked) rots.new[getSetIndex(i)][i - flattenArray(getSetIndex(i))] = slider.value / 180 * Math.PI;
      //if(!abRotation.checked && !continuous[i].checked) slider.value = 0;
    });
    slider.addEventListener('mousedown', () => { slider.clicked = true; });
    slider.addEventListener('mouseup', () => { slider.clicked = false; viewRot.innerHTML = "SO(n) rotation"; });
    slider.addEventListener('mousemove', () => { 
      if(slider.clicked) { 
        if(!continuous[i].checked) rots.new[getSetIndex(i)][i - flattenArray(getSetIndex(i))] = slider.value / 180 * Math.PI;
        viewRot.innerHTML = `${slider.value}°`;
      }
    });
    slider.addEventListener('dblclick', () => {
      if(abRotation.checked) rots.new[getSetIndex(i)][i - flattenArray(getSetIndex(i))] = 0;
      slider.value = 0;
    });
  });
  continuous.forEach((checkbox, i) => {
    checkbox.addEventListener('change', () => {
      if(!checkbox.checked) { rotSliders[i].value = abRotation.checked ? rots.new[getSetIndex(i)][i - flattenArray(getSetIndex(i))] / Math.PI * 180 : 0; }
    });
  });
}
let getSetIndex = (num, add = 0) => num - add < 0 ? add - 1 : getSetIndex(num - add, add + 1);
let flattenArray = (num, add = 0) => num == 0 ? add : flattenArray(num - 1, add + num);
let abRotation, rotSliders, continuous, viewRot;
selectRotationInputs();


// Add functionality to buttons
function selectButtonInputs() {
  manageAxes = document.querySelectorAll('#manage-axes button');

  manageAxes[0].addEventListener('click', () => {
    let positionTable = document.querySelector('#positions').children[0];
    if(positionTable.children.length - 1 > dimensionInput.value && positionTable.children.length > 4) {
      removeRotationRows();
      removePositionRow();
    }
  });
  manageAxes[1].addEventListener('click', () => {
    addRotationRows();
    addPositionRow();
  });
}
let manageAxes;
function removePositionRow() {
  let positionTable = document.querySelector('#positions').children[0];
  
  positionTable.removeChild(positionTable.children[positionTable.children.length - 1]);
  selectPositionInputs();
  aPos.pop(); rPos.pop();
  hypercube.absolutePosition.pop();
  hypercube.relativePosition.pop();
  hypercube.vertices = hypercube.vertices.map(vertice => vertice.map((point, i) => {if(i < hypercube.vertices[0].length - 1) return point}));
  
}
function addPositionRow() {
  let tableRow = document.createElement('tr');
  
  let input1 = document.createElement('input'); input1.type = 'checkbox'; input1.checked = true;
  let input2 = document.createElement('input'); input2.type = 'range'; input2.min = '0'; input2.max = '1000'; input2.value = (auto.length+1) <= dimensionInput.value ? dimensionInput.value % 2 ? sizeSlider.value * 3 : sizeSlider.value * 2.5 : sizeSlider.value * 1.3; input2.disabled = true;
  let input3 = document.createElement('input'); input3.type = 'range'; input3.min = '-1000'; input3.max = '1000'; input3.value = '0';
  
  let innerColumn1 = document.createElement('div'); innerColumn1.className = 'name'; innerColumn1.innerText = auto.length == 2 ? 'Z' : auto.length == 3 ? 'W' : `N${auto.length+1}`;
  let innerColumn2 = document.createElement('div'); innerColumn2.className = 'checkbox'; innerColumn2.appendChild(input1);
  let innerColumn3 = document.createElement('div'); innerColumn3.className = 'slider'; innerColumn3.appendChild(input2);
  let innerColumn4 = document.createElement('div'); innerColumn4.className = 'slider'; innerColumn4.appendChild(input3);
  
  let column1 = document.createElement('td'); column1.appendChild(innerColumn1); tableRow.appendChild(column1);
  let column2 = document.createElement('td'); column2.appendChild(innerColumn2); tableRow.appendChild(column2);
  let column3 = document.createElement('td'); column3.appendChild(innerColumn3); tableRow.appendChild(column3);
  let column4 = document.createElement('td'); column4.appendChild(innerColumn4); tableRow.appendChild(column4);
  
  let positionTable = document.querySelector('#positions').children[0]; positionTable.appendChild(tableRow);
  
  aPos.push(input2.value * sizeConst * getDC()); rPos.push(0);

  hypercube = new Hypercube(dimensionInput.value, sizeSlider.value * sizeConst * getDC(), aPos.slice(), rPos.slice());

  selectPositionInputs();
}
function removeRotationRows() {
  let rotationTable = document.querySelector('#rotations').children[0];
  
  let numOfRotations = getSetIndex(continuous.length - 1) + 1;

  for(let i = 0; i < numOfRotations; i++) {
    rotationTable.removeChild(rotationTable.children[rotationTable.children.length - 1]);
  }
  rots.old.pop();
  rots.new.pop();
    
  selectRotationInputs();
}
function addRotationRows() {
    const getName = (num) => num == 0 ? 'X' : num == 1 ? 'Y' : num == 2 ? 'Z' : num == 3 ? 'W' : `N${num + 1}`;
    let rotArray = [];

    for(let i = 0; i < rots.new.length + 1; i++) {
      let tableRow = document.createElement('tr');

      let input1 = document.createElement('input'); input1.type = "range"; input1.min = "-360"; input1.max = "360"; input1.value = "0";
      let input2 = document.createElement('input'); input2.type = "checkbox";

      let innerColumn1 = document.createElement('div'); innerColumn1.className = 'name'; innerColumn1.innerText = `${getName(rots.new.length + 1)}${getName(i)}`;
      let innerColumn2 = document.createElement('div'); innerColumn2.className = 'slider'; innerColumn2.appendChild(input1);
      let innerColumn3 = document.createElement('div'); innerColumn3.className = 'checkbox'; innerColumn3.appendChild(input2);

      let column1 = document.createElement('td'); column1.appendChild(innerColumn1); tableRow.appendChild(column1);
      let column2 = document.createElement('td'); column2.appendChild(innerColumn2); tableRow.appendChild(column2);
      let column3 = document.createElement('td'); column3.appendChild(innerColumn3); tableRow.appendChild(column3);

      let rotationTable = document.querySelector('#rotations').children[0]; rotationTable.appendChild(tableRow);

      rotArray.push(0);
    }
    rots.new.push(rotArray.slice());
    rots.old.push(rotArray.slice());

    selectRotationInputs();
}

selectButtonInputs();


// Helper function that finds difference between new and old angles and resets old angles to new - used in animate loop
function findDeltaAndReset() {
  let deltaSets = [];

  for(let i = 0; i < rots.new.length; i++) {
    let deltaRots = [];

    for(let j = 0; j < rots.new[i].length; j++) {
      if(continuous[flattenArray(i) + j].checked) {
        rots.new[i][j] += rotSliders[flattenArray(i) + j].value * .00035;
      }
      deltaRots.push(rots.new[i][j] - rots.old[i][j]);
      while(rots.new[i][j] > Math.PI * 2) rots.new[i][j] -= Math.PI * 2;
      rots.old[i][j] = rots.new[i][j];
    }
    deltaSets.push(deltaRots);
  }
  return deltaSets;
}




// Pointer event
let slowDown = false;
function mouseMoveEvent(event) {pointer.x = event.pageX - hypercube.absolutePosition[0]; pointer.y = event.pageY - hypercube.absolutePosition[1];}

window.addEventListener('mousedown', (e) => {
  let distanceToCenter = Math.hypot(e.pageX - hypercube.absolutePosition[0], e.pageY - hypercube.absolutePosition[1]);
  slowDown = false;
  if(distanceToCenter <= hypercube.size * .75) {
    window.addEventListener('mousemove', mouseMoveEvent);
  }
});
window.addEventListener('mouseup', () => {
  window.removeEventListener('mousemove', mouseMoveEvent);
  slowDown = true;
});


function resetInputs() {
  rotSliders[1].value = 60;
  continuous[1].checked = true;
  rotSliders[4].value = 60;
  continuous[4].checked = true;
  sizeSlider.value = 40;
  dimensionInput.value = 4;
  let rlRotation = document.querySelector('#relative-rotation');
  rlRotation.checked = true;
  abRotation.checked = false;
}
// Resize Event
window.addEventListener('resize', () => { init(); resetInputs(); });

window.addEventListener('beforeunload', () => {
  resetInputs();
})

animate();