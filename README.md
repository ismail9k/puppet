# Puppet.svg
The easiest way to control SVG elements in real time

#### Current version: 0.0.3

## Example
https://abdelrahman3d.github.io/Puppet.svg/docs/examples/character.html

## Install & basic usage

``` bash
npm install Puppet.svg
```
#### note that this package is based on javascript querySelector()
> to select element by class you should and "." before it's class name to select element by id you should and "#" before it's id

for more info about [querySelector()](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector)

#### Create new controller
``` html
<svg id="element" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle id="circle" cx="100" cy="100" r="100"/>
</svg>
<div class="controller">
    <div class="sliders__container"></div>
    <div class="modes__container"></div>
</div>
```
``` javascript
var controller = new puppet.Controller('#element', '.sliders__container', '.modes__container');
```

#### Make an element draggable
``` html
<svg id="element" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle id="circle" cx="100" cy="100" r="100"/>
</svg>
```
``` javascript
var draggable = new puppet.Draggable(controller, '#circle');
```

#### Create timeline to recored animation
``` html
<div class="controller">

    ...

    <div class="timeline__container"></div>
</div>
```
``` javascript
const timeline = new puppet.Timeline(controller, '.timeline__container', [controller.sliders, draggable.position, controller.mode]);
```

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2016 Abdelrahman Ismail
