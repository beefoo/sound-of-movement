'use strict';

var MainApp = (function() {

  function MainApp(config) {
    var defaults = {};
    this.opt = $.extend({}, defaults, config);
    this.init();
  }

  MainApp.prototype.init = function(){
    this.$viz = $('#viz');
    this.$highlighter = $('#highlighter');
    this.onScroll();
    this.loadListeners();
  };

  MainApp.prototype.loadListeners = function(){
    var _this = this;

    $(window).scroll(function(){
      _this.onScroll();
    });

    var started = false;
    $('.start-button').on('click', function(){
      if (!started) {
        _this.start();
        started = true;
      }
    });

    this.listening = false;
    var touching = false;
    var touchHandler = new Hammer(this.$viz[0]);
    touchHandler.add( new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 0 }) );
    // listen for touch events...
    touchHandler.on("panstart panmove panend", function(e) {
      touching = true;
      if (!started) {
        _this.start();
        started = true;
      }
      if (e.type === 'panstart') {
        console.log("Pan start.");
        _this.listening = true;
      } else if (e.type === 'panend') {
        console.log("Pan end.");
        _this.listening = false;
      } else if (e.type === 'panmove') {
        _this.listening = true;
        _this.pointerX = e.center.x;
        _this.pointerY = e.center.y;
      }
    });

    // // listen for mouse events
    // var $doc = $(document);
    // var mousedown = false;
    // $doc.on("mousedown", function(e){
    //   if (touching || e.target.id !== "highlighter") return;
    //   console.log("Mouse down.");
    //   e.preventDefault();
    //   mousedown = true;
    // });
    // $doc.on("mouseup", function(e){
    //   if (touching) return;
    //   console.log("Mouse up.");
    //   mousedown = false;
    //   _this.listening = false;
    // });
    // $doc.on("mousemove", function(e){
    //   if (touching) return;
    //   if (mousedown) _this.listening = true;
    //   if (_this.listening) {
    //     _this.pointerX = e.pageX;
    //     _this.pointerY = e.pageY;
    //     console.log(e.pageX, e.pageY)
    //   }
    // });

  };

  MainApp.prototype.move = function(x, y){
    this.$highlighter.css('transform', 'translate3d('+x+'px, '+y+'px, 0)');
  };

  MainApp.prototype.onScroll = function(){
    var bbox = this.$viz[0].getBoundingClientRect();
    this.offsetY = bbox.y;
    this.offsetX = bbox.x;
  };

  MainApp.prototype.play = function(x, y){

  };

  MainApp.prototype.render = function(){
    var _this = this;

    if (this.listening) {
      var x = this.pointerX - this.offsetX;
      var y = this.pointerY - this.offsetY;
      this.move(x, y);
      this.play(x, y);
      // this.move(this.pointerX, this.pointerY);
      // this.play(this.pointerX, this.pointerY);
    }

    requestAnimationFrame(function(){ _this.render(); });
  };

  MainApp.prototype.start = function(){
    this.$viz.addClass('active');
    this.render();
  };

  return MainApp;

})();

var app = new MainApp({});
