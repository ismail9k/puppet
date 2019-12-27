/**
  * Puppet SVG 0.0.3
  * (c) 2019
    * @license MIT
    */
function camelCase(name) {
  return name.replace(/-([a-z])/g, function (g) {
    return g[1].toUpperCase();
  });
}
function call(func) {
  if (typeof func === 'function') {
    func();
  }
}
function $(selector) {
  if (typeof selector !== 'string') {
    return selector;
  }

  return document.querySelector(selector);
}

class Controller {
  constructor(element, slidersContainer, modesContainer) {
    this.graphContainer;
    this.slidersContainer;
    this.modesContainer;
    this.mode;
    this.modes = [];
    this.lastPartChanged = '';
    this.sliders = {};
    this.state = true;
    this.changing = false;
    this.rotateValue = 0;
    this.translateValue = 0;
    this.listeners = [];
    this.init(element, slidersContainer, modesContainer);
  }

  init(element, slidersContainer = '.controller__sliders', modesContainer = '.controller__modes') {
    this.graphContainer = $(element);
    this.slidersContainer = $(slidersContainer);
    this.modesContainer = $(modesContainer);
    this.mode = new Proxy({
      current: '',
      previous: ''
    }, {
      get: (target, key) => {
        return target[key];
      },
      set: (target, key, value) => {
        target[key] = value;

        if (key == 'current') {
          this.graphContainer.className.baseVal = '';
          this.graphContainer.classList.add(value);
        }

        return true;
      }
    });
  }

  disable() {
    this.state = false;
  }

  enable() {
    this.state = true;
  }

  addEventListener(name, callback) {
    this.listeners.push({
      name,
      callback
    });
  }

  updateSlidersArray(name) {
    this.sliders[camelCase(name)] = $(`.range-slider__input[name="${name}"]`);
  }

  newModeButton(mode, icon) {
    let button = `<a class="mode__button ${mode}">
            ${icon}
        </a>`;
    this.modesContainer.insertAdjacentHTML('beforeend', button);
    document.querySelector(`.mode__button.${mode}`).addEventListener('click', () => this.clickModeButton(mode));
    this.modes.push(mode);
  }

  newSlider({
    part,
    origin = '50% 50%',
    rotate = 'clockwise',
    degree = 90,
    direction = 'Y',
    distance = 0,
    min = 0,
    max = 10
  }) {
    this.slidersContainer.insertAdjacentHTML('beforeend', `<div class="range-slider">
        <input class="range-slider__input" type="range" name="${part}" min="${min}" max="${max}" value="0">
        <span class="range-slider__value"></span>
      </div>`);
    this.updateSlidersArray(part); // get element and its slider

    const partElement = document.getElementById(part);
    const partSlider = document.getElementsByName(part)[0];
    const partSliderValue = partSlider.parentNode.querySelector('.range-slider__value'); // set element transform origin

    partElement.style.transformOrigin = origin;
    partSliderValue.innerHTML = partSlider.value; // add listener to the element controller

    partSlider.addEventListener('input', () => {
      // check if the controller is enabled
      if (this.state) {
        // set flag that the slider is changed
        this.changing = true;
        this.lastPartChanged = camelCase(part); // calculate transforms values

        this.rotateValue = (rotate == 'clockwise' ? 1 : -1) * partSlider.value * degree / partSlider.max;
        this.translateValue = partSlider.value * distance / partSlider.max; // update slider value

        partSliderValue.innerHTML = partSlider.value; // apply transforms to element

        partElement.style.transform = `rotate(${this.rotateValue}deg) translate${direction.toUpperCase()}(${this.translateValue}px)`;
      }

      this.changing = false;
      this.listeners.filter(e => e.name === 'sliderChanged').forEach(l => {
        l.callback(this.lastPartChanged);
      });
    });
  }

  morph(object, shape) {
    object = $(object);
    shape = $(shape).getAttribute('d');
    document.getElementById('mouth').setAttribute('d', shape);
  }

  changeMode(mode, reset = true) {
    if (!reset && this.mode.current != '') {
      this.mode.previous = this.mode.current;
    } else {
      this.mode.previous = mode;
    }

    this.mode.current = mode;
    this.listeners.filter(e => e.name === 'modeChanged').forEach(l => {
      l.callback(this.mode.current, this.mode.previous);
    });
  }

  clickModeButton(mode) {
    if (this.currentMode != mode && this.state) {
      let modeButtons = Array.from(document.querySelectorAll('.mode__button'));
      modeButtons.forEach(modeButton => modeButton.classList.remove('active'));
      $(`.mode__button.${mode}`).classList.add('active');
      this.changeMode(mode);
    }
  }

  changeSlider(part, newValue) {
    part.value = newValue;
    part.dispatchEvent(new Event('input'));
    part.dispatchEvent(new Event('change'));
  }

  random() {
    Object.keys(this.sliders).forEach(key => {
      let slider = this.sliders[key];
      this.changeSlider(slider, Math.random() * slider.max + Math.random() * slider.min);
    });
    setTimeout(() => {
      this.changing = false;
    }, 500);
  }

  reset() {
    Object.keys(this.sliders).forEach(key => {
      let slider = this.sliders[key];
      this.changeSlider(slider, 0);
    });
    setTimeout(() => {
      this.changing = false;
    }, 500);
  }

}

class Draggable {
  constructor(controller, element, settings) {
    this.controller;
    this.graphContainer;
    this.element;
    this.setting;
    this.position;
    this.currentX = 0;
    this.currentY = 0;
    this.moveFunction;
    this.init(controller, element, settings);
  }

  init(controller, element, {
    dragMode = 'dragging',
    select,
    move,
    release
  } = {}) {
    this.controller = controller;
    this.graphContainer = controller.graphContainer;
    this.element = $(element);
    this.element.setAttribute('style', 'transform: translate(0, 0)');
    this.settings = {
      dragMode: dragMode,
      select: select,
      move: move,
      release: release
    };
    this.element.addEventListener('mousedown', event => this.select(event));
    this.element.addEventListener('touchstart', event => this.touch(event));
    this.position = new Proxy({
      x: 0,
      y: 0
    }, {
      get: (target, key) => {
        return target[key];
      },
      set: (target, key, value) => {
        target[key] = value;
        this.moveElement(this.element, this.position.x, this.position.y);
        call(this.settings.move);
        return true;
      }
    });
  }

  release() {
    this.graphContainer.removeEventListener('mousemove', this.moveFunction);
    this.graphContainer.removeEventListener('touchmove', this.moveFunction);
    this.controller.changeMode(this.controller.mode.previous, true);
    call(this.settings.release);
  }

  moveElement(element, x, y) {
    element.setAttribute('style', `transform: translate(${x}px, ${y}px)`);
  }

  move(event) {
    let xRatio = 0;
    let yRatio = 0;
    const graphContainer = this.graphContainer;
    const viewBoxVal = this.graphContainer.viewBox.baseVal;

    if (graphContainer.clientWidth > graphContainer.clientHeight) {
      yRatio = viewBoxVal.height / graphContainer.clientHeight;
      xRatio = viewBoxVal.width / graphContainer.clientHeight;
    } else {
      yRatio = viewBoxVal.height / graphContainer.clientWidth;
      xRatio = viewBoxVal.width / graphContainer.clientWidth;
    }

    if (event.type == 'touchmove') {
      let dx = event.touches[0].clientX - this.currentX;
      let dy = event.touches[0].clientY - this.currentY;
      this.position.x += dx * xRatio;
      this.position.y += dy * yRatio;
      this.currentX = event.touches[0].clientX;
      this.currentY = event.touches[0].clientY;
      return;
    } // mouse event


    let dx = event.clientX - this.currentX;
    let dy = event.clientY - this.currentY;
    this.position.x += dx * xRatio;
    this.position.y += dy * yRatio; // update the new mouse position

    this.currentX = event.clientX;
    this.currentY = event.clientY;
  }

  select(event) {
    // stop browser default function
    event.preventDefault(); // make sure it's left mouse button

    if (event.buttons == 1) {
      // change to drag mode
      this.controller.changeMode(this.settings.dragMode, false); // calculate variables

      this.currentX = event.clientX;
      this.currentY = event.clientY;
      this.currentPosition();
      this.graphContainer.addEventListener('mousemove', this.moveFunction = event => this.move(event));
      this.graphContainer.addEventListener('mouseup', () => {
        this.release();
      });
      document.addEventListener('mouseout', event => {
        if (event.toElement == null && event.relatedTarget == null) {
          this.release();
        }
      });
      call(this.settings.select);
    }
  }

  touch(event) {
    // change to drag mode
    this.controller.changeMode(this.settings.dragMode, false); // calculate variables

    this.currentX = event.touches[0].clientX;
    this.currentY = event.touches[0].clientY;
    this.currentPosition(); // change character position

    this.graphContainer.addEventListener('touchmove', this.moveFunction = event => this.move(event));
    this.graphContainer.addEventListener('touchend', () => {
      this.release();
    });
    call(this.settings.select);
  }

  currentPosition() {
    const tempPosition = this.element.style.transform.slice(10, -1).split(', ');
    this.position.x = parseFloat(tempPosition[0]);
    this.position.y = parseFloat(tempPosition[1]);
  }

}

let timelineButtons = `
  <div class="timeline__container">
    <div class="timeline__track">
    </div>
  </div>
  <div class="timeline__buttons">
    <a class="timeline__play play timeline__button">
      <svg class="timeline__icon" viewBox="0 0 50 50">
        <title>timeline play</title>
        <polygon id="play" points="5,1.9 45,25 5,48.1 "/>
        <g id="pause">
          <rect x="10.4" y="4" width="11.2" height="41.9"/>
          <rect x="28.4" y="4" width="11.2" height="41.9"/>
        </g>
      </svg>
      <a class="timeline__record timeline__button">
        <svg class="timeline__icon" viewBox="0 0 50 50">
          <title>timeline record</title>
          <circle cx="25" cy="25" r="20"/>
        </svg>
      </a>
      <a class="timeline__keyframe timeline__button">
        <svg class="timeline__icon" viewBox="0 0 50 50">
          <title>timeline keyframe</title>
          <rect y="21.5" width="50" height="7"/>
          <rect x="21.5" y="0" width="7" height="50"/>
        </svg>
      </a>
    </a>
  </div>`;

let timeLineFrame = '<a class="timeline__frame" href="#"></a>';

class Timeline {
  constructor(controller, container, trackers) {
    this.controller;
    this.draggable;
    this.timelineValues = [];
    this.time = 0;
    this.trackers = [];
    this.timelineAnimation = '';
    this.init(controller, container, trackers);
  }

  init(controller, container, trackers) {
    this.controller = controller;
    this.trackers = trackers;
    document.querySelector(container).insertAdjacentHTML('beforeend', timelineButtons);
    document.querySelector('.timeline__play').addEventListener('click', () => this.playPause(document.querySelector('.timeline__play')));
    document.querySelector('.timeline__record').addEventListener('click', () => this.recordFrame());
    document.querySelector('.timeline__keyframe').addEventListener('click', () => this.addFrame());
  }

  updateTime(t) {
    this.time = t;
  }

  updateFrames() {
    this.frames = Array.from(document.querySelectorAll('.timeline__frame'));
    this.frames.forEach((frame, index) => {
      frame.addEventListener('click', () => this.cursorPositioning(index));
    });
  }

  recordFrame() {
    let keyFrame = {};
    this.trackers.forEach(tracker => {
      Object.keys(tracker).forEach(key => {
        if (tracker[key].value === undefined) {
          keyFrame[key] = tracker[key];
        } else {
          keyFrame[key] = tracker[key].value;
        }
      });
    });
    this.timelineValues[this.time] = keyFrame;
  }

  playFrame() {
    if (this.timelineValues[this.time] != undefined) {
      this.trackers.forEach(tracker => {
        Object.keys(tracker).forEach(key => {
          if (tracker[key].value === undefined) {
            tracker[key] = this.timelineValues[this.time][key];
          } else {
            tracker[key].value = this.timelineValues[this.time][key];
            tracker[key].dispatchEvent(new Event('input'));
            tracker[key].dispatchEvent(new Event('change'));
          }
        });
      });
    }
  }

  playTimeline() {
    this.timelineAnimation = setInterval(() => {
      if (this.time == this.frames.length - 1) {
        this.cursorPositioning(0);
      } else {
        this.cursorPositioning(this.time + 1);
      }
    }, 1000);
  }

  pauseTimeline() {
    clearInterval(this.timelineAnimation);
  }

  playPause(button) {
    if (button.classList.contains('play')) {
      button.classList.remove('play');
      button.classList.add('pause');
      this.playTimeline();
    } else if (button.classList.contains('pause')) {
      button.classList.remove('pause');
      button.classList.add('play');
      this.pauseTimeline();
    }
  }

  addFrame() {
    document.querySelector('.timeline__track').insertAdjacentHTML('beforeend', timeLineFrame);
    this.updateFrames();
    this.cursorPositioning(this.frames.length - 1);
    this.recordFrame();
  }

  cursorPositioning(index) {
    this.updateTime(index);
    this.frames.forEach(frame => frame.classList.remove('active'));
    this.frames[this.time].classList.add('active');
    this.playFrame();
  }

}

var index = {
  Controller,
  Draggable,
  Timeline
};

export default index;
