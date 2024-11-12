/**
 * JS for Hartcore
 * Alexandre Andrieux @2015
 * Main functions
 */
var hc = {
    worlds: [],
    startTime: null,
    anim: null,
    summon: function() {
      for (key in arguments) {
        this.worlds.push(arguments[key]);
      }
    },
    ignite: function() {
      this.startTime = new Date().getTime();
      this.igniteWorlds();
      this.frame();
    },
    frame: function() {
      hc.paint(new Date().getTime());
      hc.anim = window.requestAnimationFrame(hc.frame);
    },
      paint: function(t) {
      for (key in hc.worlds) {
        hc.worlds[key].world.update(t - hc.startTime);
      }
    },
    igniteWorlds: function() {
      for (key in this.worlds) {
        this.worlds[key].world.ignite(this.worlds[key].args);
      }
    }
  };
  
  /**
   * JS for Hartcore hc_stellar
   * Alexandre Andrieux @2015
   * Stellar world
   */
  var hc_stellar = {
      name: "stellar",
      ignite: function() {
          
          var canvas = document.createElement('canvas');
          canvas.class = "hart";
          canvas.id = this.name;
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          document.body.appendChild(canvas);
          
          this.canvas = document.getElementById(canvas.id);
          this.ctx = this.canvas.getContext('2d');
          
          this.explosionRadius = 15;
          
          this.superColor = "rgba(255,255,255,0.1)";
          
          this.silenceCounter = 0;
          this.speakingCounter = 0;
          this.silenceCountMax = 1;
          this.speakingCountMax = 2;
          
          this.repulsion = 0;
          this.minRep = 0;
          this.maxRep = 50;
          this.maxRepScale = 50;//px
          this.acceleration = 5;
          this.accelerationSmooth = 100000;
          this.minAcc = -10;
          this.maxAcc = 10;
          this.minAngSpeed = -10;
          this.maxAngSpeed = 10;
          
          this.expCounter = 0;
          this.expressivenessVar = 5000;
          this.expressiveness = 0;
          
          this.around = [];
          this.flying = [];
          this.bigRadius = 0.45 * Math.min(this.canvas.height, this.canvas.width);
          this.bigCenterX = this.canvas.width/2;
          this.bigCenterY = this.canvas.height/2;
          
          this.background();
          
          this.feed(50);
      },
      background: function() {
          this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);
          this.ctx.fillStyle = "black";
          this.ctx.fill();
      },
      update: function(t) {
          this.evolve(t);
          this.move();
          this.draw();
      },
      evolve: function(t) {
          // Laws
          this.simulateExpressiveness();
          this.simulateSilence();
          this.naturalRepulsionDecrease();
          this.naturalAccelerationDecrease();
          
          // Effects
          if (this.silence == 1) {
              this.silenceCounter++;
          } else {
              this.speakingCounter++;
          }		
          if (this.silenceCounter >= this.silenceCountMax) {
              this.angAcc--;
              this.repulsion--;
              if (this.angAcc <= this.minAngAcc) {
                  this.angAcc = this.minAngAcc;
              }
              if (this.repulsion <= this.minRep) {
                  this.repulsion = this.minRep;
              }
              this.silenceCounter = 0;
              
          }
          if (this.speakingCounter >= this.speakingCountMax) {
              this.angAcc++;
              this.repulsion++;
              if(this.angAcc >= this.maxAngAcc) {
                  this.angAcc = this.maxAngAcc;
              }
              if(this.repulsion >= this.maxRep) {
                  this.repulsion = this.maxRep;
              }
              this.speakingCounter = 0;
          }
          
          // Births and deaths
          var howMany = Math.floor(Math.random()*(1 + this.expressiveness));// 1 in ?
          this.feed(howMany);
          this.detach(howMany);
      },
      simulateExpressiveness: function() {
          this.expCounter++;
          // Full range
          //this.expressiveness = 0.5 + 0.5*Math.sin(this.expCounter/this.expressivenessVar*2*Math.PI);
          
          // Low values
          //this.expressiveness = 0.2 + 0.2*Math.sin(this.expCounter/this.expressivenessVar*2*Math.PI);
          
          // Highvalues with sunburst effect
          //this.expressiveness = 0.8 + 0.2*1/5*Math.floor(5*Math.sin(this.expCounter/this.expressivenessVar*2*Math.PI));
          
          // Full range with sunburst effect
          //this.expressiveness = 0.5 + 0.5*1/3*Math.floor(3*Math.sin(this.expCounter/this.expressivenessVar*2*Math.PI));
          
          // Live data with sunburst effect
          //this.expressiveness = 1/7 * Math.floor(7 * parseFloat(data[1]));
          //this.expressiveness = parseFloat(data[1]);
          
          // Scattered linear
          //this.expressiveness = ( this.expCounter % this.expressivenessVar ) / this.expressivenessVar;
          // Scattered linear with sunburst
          this.expressiveness = 1/12 * Math.floor( 12 * ( this.expCounter % this.expressivenessVar ) / this.expressivenessVar);
          
          // Blur the thresholds a little
          this.expressiveness += 0.02*Math.random();
      },
      simulateSilence: function() {
          this.simuSilCounter++;
          this.silence = Math.floor(( 1 + this.simuSilRate ) * ( 1 + Math.sin(this.simuSilCounter/this.silenceVar * 2*Math.PI)) / 2);
          this.silence = parseInt(this.silence);
      },
      naturalRepulsionDecrease: function(){
          this.repulsion -= 1-0.95;
          if (this.repulsion <= this.minRep) {
              this.repulsion = this.minRep;
          }
      },
      naturalAccelerationDecrease: function(){
          this.acceleration -= 0.01;
          if (this.acceleration <= 0) {
              this.acceleration = 0;
          }
      },
      move: function() {
          this.moveBullets();
      },
      draw: function() {
          this.drawBullets();
      },
      addBullet: function(way) {
          var rad = this.bigRadius + 10 * Math.random();
          var angle = 2*Math.PI*Math.random();
          this.around.push({
              r: rad,
              rLast: rad,
              rSpeed: 0,
              ang: angle,
              angLast: angle,
              angSpeed: 0.005,
              way: way
          });
      },
      moveBullets: function() {
          // In around
          for (key in this.around) {
              // Whay way will motion happen?
              if (this.around[key].way == "clockwise") {
                  var multip = -1;
              } else if (this.around[key].way == "anticlockwise") {
                  var multip = 1;
              }
              else { console.log('No way'); }
              
              // New angle speed
              var oldAngSpeed = this.around[key].angSpeed;
              this.around[key].angSpeed = oldAngSpeed + (multip * this.acceleration / this.accelerationSmooth);
              // Well, careful
              this.around[key].angSpeed = Math.min(Math.max(this.around[key].angSpeed, this.minAngSpeed), this.maxAngSpeed);
              // New angle
              this.around[key].angLast = this.around[key].ang;
              this.around[key].ang += this.around[key].angSpeed;
              
              // New radius with repulsion
              // Memorize last r (if you don't, the brush becomes 'vortex'
              this.around[key].rLast = this.around[key].r;
              this.around[key].r += (2*Math.random()-1) * (this.maxRepScale * (this.repulsion-this.minRep)/(this.maxRep-this.minRep));
          }
          /*
          // In flying
          for (key2 in this.flying) {
              //keep the bullet within the canvas
              if (this.around[key].x > this.canvas.width) {
                  this.around[key].x = this.canvas.width;
                  this.dying.push(this.around[key]);
                  this.around.splice(key,1);
              }
              if (this.around[key].y > this.canvas.height) {
                  this.around[key].y = this.canvas.height;
                  this.dying.push(this.around[key]);
                  this.around.splice(key,1);				
              }
              if (this.around[key].x < 0) {
                  this.around[key].x = 0;
                  this.dying.push(this.around[key]);
                  this.around.splice(key,1);				
              }
              if (this.around[key].y < 0) {
                  this.around[key].y = 0;
                  this.dying.push(this.around[key]);
                  this.around.splice(key,1);			
              }
          }
          */
      },
      drawBullets: function() {
          
          this.ctx.strokeStyle = this.superColor;
          this.ctx.lineWidth = 2;
          for (key in this.around) {
              var x = this.bigCenterX + this.around[key].r * Math.cos(this.around[key].ang);
              var y = this.bigCenterY + this.around[key].r * Math.sin(this.around[key].ang);
              var xLast = this.bigCenterX + this.around[key].rLast * Math.cos(this.around[key].angLast);
              var yLast = this.bigCenterY + this.around[key].rLast * Math.sin(this.around[key].angLast);
              this.ctx.beginPath();
              this.ctx.moveTo(xLast,yLast);
              this.ctx.lineTo(x,y);
              this.ctx.stroke();
          }
          /*
          for (key2 in this.flying) {
              this.ctx.beginPath();
              this.ctx.moveTo(this.bullets[key].xLast,this.bullets[key].yLast);
              this.ctx.lineTo(this.bullets[key].x,this.bullets[key].y);
              this.ctx.strokeStyle = this.superColor;
              this.ctx.lineWidth = 3;
              this.ctx.stroke();
          }
          */
      },
      feed: function(howMany) {
          // Add bullets to around array
          for (var i = 0; i < howMany; i++) {
              this.addBullet("anticlockwise");
          }
      },
      detach: function(howMany) {
          // Moves bullets from around array to flying array
          // Gives them a bunch of new properties
          var targetDist = 10;
          for (var i = 0; i < howMany; i++) {
              var newFlyer = this.around.shift();
              
              this.flying.push(newFlyer);
          }
      }
  };
  
  // Go go go!
  hc.summon({
    world: hc_stellar,
    args: []
  });
  hc.ignite();