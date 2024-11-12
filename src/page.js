/**
 * JS for Hexocet
 * 
 * @author Alexandre Andrieux
 * @since 2017-01-05
 */

var Hexocet = {
  seeds: [],
  stepCount: 0,
  birthPeriod: 1,
  hexSize: 20,
  targetBounceChance: 0.02,
  springStiffness: 0.01,
  viscosity: 0.8,
  particleOpacity: 0.7,
  fade: true,
  fadeLayerOpacity: 0.04
};
Hexocet.setupCanvas = function() {
  // Initialize own canvas
	var canvas = document.createElement('canvas');
	canvas.id = 'hexocet';
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	document.body.appendChild(canvas);

  // Get and store canvas context
	this.canvas = document.getElementById(canvas.id);
	this.ctx = this.canvas.getContext('2d');
  
  // Scale parameter
  this.canvasBase = Math.min(this.canvas.width, this.canvas.height);
  // Central point coordinates
  this.xC = this.canvas.width / 2;
  this.yC = this.canvas.height / 2;
};
Hexocet.hexCoordsToXY = function(Hx, Hy) {
  // Hx and Hy are integers corresponding to vertices coordinates in Hex space
  var xPrime, yPrime, XYprime, X, Y, XY;
  var isSumEven = ( (parseInt(Hx) + parseInt(Hy)) % 2 == 0 ? 1 : 0);
  xPrime = 1 * Hx;
  yPrime = 1 /Math.sqrt(3) * (3*Hy + 1 + isSumEven);
  
  XYprime = new Victor(xPrime * this.hexSize, yPrime * this.hexSize);
  XY = XYprime.clone().rotateDeg(30);
  
  return { x: XY.x, y: XY.y };
};
Hexocet.XYtoHexCoords = function(x, y) {
  // Approximate
  var XYprime = new Victor(x / this.hexSize, y / this.hexSize).rotateDeg(-30);
  var Hx = XYprime.x,
      Hy = Math.sqrt(3) * XYprime.y/3;
  return { Hx: Math.floor(Hx), Hy: Math.floor(Hy) };
};
Hexocet.update = function() {
  this.stepCount++;
  
  // Birthrate management
	if (this.stepCount % this.birthPeriod == 0 && this.stepCount < 60000) {
    this.birth();
  }
  
  this.move();
  this.draw();
};
Hexocet.birth = function(xBirth, yBirth, seed) {
  // Give birth around the canvas center
  var targetH = this.XYtoHexCoords(xBirth || this.xC, yBirth || this.yC);
  // I said AROUND
  var spreadArea = 1;
  targetH.Hx += Math.floor(spreadArea * (-0.5 + Math.random()));
  targetH.Hy += Math.floor(spreadArea * (-0.5 + Math.random()));
  // Convert in Cartesian coords
  var targetXY = this.hexCoordsToXY(targetH.Hx, targetH.Hy);
  
  var seed = seed || {
    xLast: targetXY.x,
    x: targetXY.x,
    xSpeed: 0,
    yLast: targetXY.y,
    y: targetXY.y,
    ySpeed: 0,
    targetHx: targetH.Hx,
    targetHy: targetH.Hy,
    age: 0,
    hue: 190 + 15 * Math.sin(this.stepCount / 50)
  };
  this.seeds.push(seed);
};
Hexocet.move = function() {
  // Move all particles
  for (var i = 0; i < this.seeds.length; i++) {
    var seed = this.seeds[i];
    // Get older
    seed.age++;
    // Save last position
    seed.xLast = seed.x;
    seed.yLast = seed.y;
    
    // Randomly change target
    if (Math.random() < this.targetBounceChance) {
      // Either move Hx or Hy, twice more likely to change Hx
      if (Math.random() > 0.33) {
        // Move Hx
        seed.targetHx += (Math.random() > 0.5 ? 1 : -1);
      } else {
        // Increase Hy + Hx is even
        if ((seed.targetHx + seed.targetHy) % 2 == 0) {
          seed.targetHy += 1;
        } else {
          seed.targetHy -= 1;
        }
        
      }
    }
    
    // Acceleration based on target
    var targetXY = this.hexCoordsToXY(seed.targetHx, seed.targetHy);
    // Spring
    var K = this.springStiffness;
    var accX = - K * (seed.x - targetXY.x);
    var accY = - K * (seed.y - targetXY.y);
    // Viscosity
    var visc = this.viscosity;
    accX -= visc * seed.xSpeed;
    accY -= visc * seed.ySpeed;
    // Speed
    seed.xSpeed += accX;
    seed.ySpeed += accY;
    
    // Speed calmers (here normalizers)
    /*
    var fixedSpeed = 0.0001;
		var maxSpeed = fixedSpeed, minSpeed = fixedSpeed;
		var speed = Math.sqrt(Math.pow(this.xSpeed, 2) + Math.pow(this.ySpeed, 2));
		if (speed > maxSpeed) {
			seed.xSpeed *= maxSpeed / speed;
			seed.ySpeed *= maxSpeed / speed;
		}
		if (speed < minSpeed) {
			seed.xSpeed *= minSpeed / speed;
			seed.ySpeed *= minSpeed / speed;
		}
    */
    
    // Position, with added canvas base size in order to maintain patterns accross zoom levels
    seed.x += 0.01 * seed.xSpeed * this.canvasBase;
    seed.y += 0.01 * seed.ySpeed * this.canvasBase;
  }
};
Hexocet.draw = function() {
  // Add translucid layer for trace effect
  if (this.fade) {
    var opa = this.fadeLayerOpacity;
    this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.fillStyle = "rgba(0, 0, 0, " + opa + ")";
		this.ctx.fill();
  }
  for (var key in this.seeds) {
    var seed = this.seeds[key];

    // HSLA
    var hsla = {
      h: seed.hue,
      s: '90%',
      l: '55%',
      a: this.particleOpacity
    };

    // Line width
    var wLine = 2;

    // Stroke
    this.ctx.strokeStyle = 'hsla(' + hsla.h + ', ' + hsla.s + ', ' + hsla.l + ", " + hsla.a + ")";
    this.ctx.lineWidth = wLine;
    this.ctx.lineCap = "round";
    this.ctx.beginPath();
    this.ctx.moveTo(seed.xLast, seed.yLast);
    this.ctx.lineTo(seed.x, seed.y);
    this.ctx.stroke();
    
    // Point target in color
    /*
    hsla = {
      h: seed.hue,
      s: '70%',
      l: '100%',
      a: 0.01
    };
    
    wLine = 5;
    
    var targetXY = this.hexCoordsToXY(seed.targetHx, seed.targetHy);
    var tX = targetXY.x,
        tY = targetXY.y;
    this.ctx.lineWidth = wLine;
    this.ctx.strokeStyle = 'hsla(' + hsla.h + ', ' + hsla.s + ', ' + hsla.l + ", " + hsla.a + ")";
    this.ctx.beginPath();
    this.ctx.moveTo(tX, tY);
    this.ctx.lineTo(tX, tY);
    this.ctx.stroke();
    */
  }
};
Hexocet.testTheGrid = function() {
  // Line width
  var wLine = 5;

  // Stroke
  this.ctx.lineWidth = wLine;
  this.ctx.lineCap = "round";
  
  for (var i = -100; i < 100; i++) {
    for (var j = -100; j < 100; j++) {
      // HSLA
      var hsla = {
        h: 20 * j,
        s: '50%',
        l: '100%',
        a: 0.5
      };
      this.ctx.strokeStyle = 'hsla(' + hsla.h + ', ' + hsla.s + ', ' + hsla.l + ", " + hsla.a + ")";
      this.ctx.beginPath();
      var XY = this.hexCoordsToXY(i, j);
      this.ctx.moveTo(XY.x, XY.y);
      this.ctx.lineTo(XY.x, XY.y);
      this.ctx.stroke();
    }
  }
};

jQuery(document).ready(function() {
  Hexocet.setupCanvas();
  
  var frame = function() {
    Hexocet.update();
    window.requestAnimationFrame(frame);
  };
  frame();
  
  //Hexocet.testTheGrid();
  
  // Particle spread on click
  jQuery('canvas#hexocet').on('mousemove', function(event) {
    var x = event.pageX,
        y = event.pageY;
    Hexocet.birth(x, y)
  });
});

// Victor.js
/*!
MIT License

Copyright (c) 2011 Max Kueng, George Crabtree
 
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
 
The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.
 
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
!function(t){if("object"==typeof exports)module.exports=t();else if("function"==typeof define&&define.amd)define(t);else{var i;"undefined"!=typeof window?i=window:"undefined"!=typeof global?i=global:"undefined"!=typeof self&&(i=self),i.Victor=t()}}(function(){return function t(i,r,n){function o(s,h){if(!r[s]){if(!i[s]){var u="function"==typeof require&&require;if(!h&&u)return u(s,!0);if(e)return e(s,!0);throw new Error("Cannot find module '"+s+"'")}var p=r[s]={exports:{}};i[s][0].call(p.exports,function(t){var r=i[s][1][t];return o(r?r:t)},p,p.exports,t,i,r,n)}return r[s].exports}for(var e="function"==typeof require&&require,s=0;s<n.length;s++)o(n[s]);return o}({1:[function(t,i,r){function n(t,i){return this instanceof n?(this.x=t||0,void(this.y=i||0)):new n(t,i)}function o(t,i){return Math.floor(Math.random()*(i-t+1)+t)}function e(t){return t*h}function s(t){return t/h}r=i.exports=n,n.fromArray=function(t){return new n(t[0]||0,t[1]||0)},n.fromObject=function(t){return new n(t.x||0,t.y||0)},n.prototype.addX=function(t){return this.x+=t.x,this},n.prototype.addY=function(t){return this.y+=t.y,this},n.prototype.add=function(t){return this.x+=t.x,this.y+=t.y,this},n.prototype.addScalar=function(t){return this.x+=t,this.y+=t,this},n.prototype.addScalarX=function(t){return this.x+=t,this},n.prototype.addScalarY=function(t){return this.y+=t,this},n.prototype.subtractX=function(t){return this.x-=t.x,this},n.prototype.subtractY=function(t){return this.y-=t.y,this},n.prototype.subtract=function(t){return this.x-=t.x,this.y-=t.y,this},n.prototype.subtractScalar=function(t){return this.x-=t,this.y-=t,this},n.prototype.subtractScalarX=function(t){return this.x-=t,this},n.prototype.subtractScalarY=function(t){return this.y-=t,this},n.prototype.divideX=function(t){return this.x/=t.x,this},n.prototype.divideY=function(t){return this.y/=t.y,this},n.prototype.divide=function(t){return this.x/=t.x,this.y/=t.y,this},n.prototype.divideScalar=function(t){return 0!==t?(this.x/=t,this.y/=t):(this.x=0,this.y=0),this},n.prototype.divideScalarX=function(t){return 0!==t?this.x/=t:this.x=0,this},n.prototype.divideScalarY=function(t){return 0!==t?this.y/=t:this.y=0,this},n.prototype.invertX=function(){return this.x*=-1,this},n.prototype.invertY=function(){return this.y*=-1,this},n.prototype.invert=function(){return this.invertX(),this.invertY(),this},n.prototype.multiplyX=function(t){return this.x*=t.x,this},n.prototype.multiplyY=function(t){return this.y*=t.y,this},n.prototype.multiply=function(t){return this.x*=t.x,this.y*=t.y,this},n.prototype.multiplyScalar=function(t){return this.x*=t,this.y*=t,this},n.prototype.multiplyScalarX=function(t){return this.x*=t,this},n.prototype.multiplyScalarY=function(t){return this.y*=t,this},n.prototype.normalize=function(){var t=this.length();return 0===t?(this.x=1,this.y=0):this.divide(n(t,t)),this},n.prototype.norm=n.prototype.normalize,n.prototype.limit=function(t,i){return Math.abs(this.x)>t&&(this.x*=i),Math.abs(this.y)>t&&(this.y*=i),this},n.prototype.randomize=function(t,i){return this.randomizeX(t,i),this.randomizeY(t,i),this},n.prototype.randomizeX=function(t,i){var r=Math.min(t.x,i.x),n=Math.max(t.x,i.x);return this.x=o(r,n),this},n.prototype.randomizeY=function(t,i){var r=Math.min(t.y,i.y),n=Math.max(t.y,i.y);return this.y=o(r,n),this},n.prototype.randomizeAny=function(t,i){return Math.round(Math.random())?this.randomizeX(t,i):this.randomizeY(t,i),this},n.prototype.unfloat=function(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this},n.prototype.toFixed=function(t){return"undefined"==typeof t&&(t=8),this.x=this.x.toFixed(t),this.y=this.y.toFixed(t),this},n.prototype.mixX=function(t,i){return"undefined"==typeof i&&(i=.5),this.x=(1-i)*this.x+i*t.x,this},n.prototype.mixY=function(t,i){return"undefined"==typeof i&&(i=.5),this.y=(1-i)*this.y+i*t.y,this},n.prototype.mix=function(t,i){return this.mixX(t,i),this.mixY(t,i),this},n.prototype.clone=function(){return new n(this.x,this.y)},n.prototype.copyX=function(t){return this.x=t.x,this},n.prototype.copyY=function(t){return this.y=t.y,this},n.prototype.copy=function(t){return this.copyX(t),this.copyY(t),this},n.prototype.zero=function(){return this.x=this.y=0,this},n.prototype.dot=function(t){return this.x*t.x+this.y*t.y},n.prototype.cross=function(t){return this.x*t.y-this.y*t.x},n.prototype.projectOnto=function(t){var i=(this.x*t.x+this.y*t.y)/(t.x*t.x+t.y*t.y);return this.x=i*t.x,this.y=i*t.y,this},n.prototype.horizontalAngle=function(){return Math.atan2(this.y,this.x)},n.prototype.horizontalAngleDeg=function(){return e(this.horizontalAngle())},n.prototype.verticalAngle=function(){return Math.atan2(this.x,this.y)},n.prototype.verticalAngleDeg=function(){return e(this.verticalAngle())},n.prototype.angle=n.prototype.horizontalAngle,n.prototype.angleDeg=n.prototype.horizontalAngleDeg,n.prototype.direction=n.prototype.horizontalAngle,n.prototype.rotate=function(t){var i=this.x*Math.cos(t)-this.y*Math.sin(t),r=this.x*Math.sin(t)+this.y*Math.cos(t);return this.x=i,this.y=r,this},n.prototype.rotateDeg=function(t){return t=s(t),this.rotate(t)},n.prototype.rotateTo=function(t){return this.rotate(t-this.angle())},n.prototype.rotateToDeg=function(t){return t=s(t),this.rotateTo(t)},n.prototype.rotateBy=function(t){var i=this.angle()+t;return this.rotate(i)},n.prototype.rotateByDeg=function(t){return t=s(t),this.rotateBy(t)},n.prototype.distanceX=function(t){return this.x-t.x},n.prototype.absDistanceX=function(t){return Math.abs(this.distanceX(t))},n.prototype.distanceY=function(t){return this.y-t.y},n.prototype.absDistanceY=function(t){return Math.abs(this.distanceY(t))},n.prototype.distance=function(t){return Math.sqrt(this.distanceSq(t))},n.prototype.distanceSq=function(t){var i=this.distanceX(t),r=this.distanceY(t);return i*i+r*r},n.prototype.length=function(){return Math.sqrt(this.lengthSq())},n.prototype.lengthSq=function(){return this.x*this.x+this.y*this.y},n.prototype.magnitude=n.prototype.length,n.prototype.isZero=function(){return 0===this.x&&0===this.y},n.prototype.isEqualTo=function(t){return this.x===t.x&&this.y===t.y},n.prototype.toString=function(){return"x:"+this.x+", y:"+this.y},n.prototype.toArray=function(){return[this.x,this.y]},n.prototype.toObject=function(){return{x:this.x,y:this.y}};var h=180/Math.PI},{}]},{},[1])(1)});