'use strict';

function isInside(point, points) {
  // ray-casting algorithm based on
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
  var x = point[0], y = point[1];
  var inside = false;
  for (var i = 0, j = points.length - 1; i < points.length; j = i++) {
    var xi = points[i][0], yi = points[i][1];
    var xj = points[j][0], yj = points[j][1];

    var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

var MainApp = (function() {

  function MainApp(config) {
    var defaults = {};
    this.opt = $.extend({}, defaults, config);
    this.init();
  }

  MainApp.prototype.init = function(){
    var _this = this;
    this.$viz = $('#viz');
    this.$highlighter = $('#highlighter');
    this.$label = $('#label');
    this.$video = $('#video');
    this.video = this.$video[0];

    this.lastX = false;
    this.lastY = false;
    this.vizWidth = false;
    this.vizHeight = false;
    this.lastState = false;

    _this.onScroll();

    $.when(
      _this.loadData(),
      _this.loadVideo()

    ).done(function(){

      _this.onResize();
      _this.loadListeners();
    });
  };

  MainApp.prototype.loadData = function(){
    var _this = this;
    var promise = $.Deferred();

    $.getJSON("data/states.json", function(data) {
      _this.states = data;
      promise.resolve();
    });

    return promise;
  };

  MainApp.prototype.loadListeners = function(){
    var _this = this;

    $(window).resize(function(){
      _this.onResize();
    });

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

  MainApp.prototype.loadVideo = function(){
    var promise = $.Deferred();

    this.video.addEventListener('loadeddata', function() {
       promise.resolve();
    }, false);

    return promise;
  };

  MainApp.prototype.move = function(x, y){
    this.$highlighter.css('transform', 'translate3d('+x+'px, '+y+'px, 0)');

    if (this.vizHeight===false) return;
    var ny = y / this.vizHeight;
    if (ny > 0.5) this.$highlighter.addClass('top');
    else this.$highlighter.removeClass('top');
  };

  MainApp.prototype.onResize = function(){
    var _this = this;
    var states = this.states;
    var width = this.$viz.width();
    var height = this.$viz.height();
    this.vizHeight = height;
    this.vizWidth = width;

    for (var i=0; i<states.length; i++) {
      var state = states[i];
      var newPoints = [];
      for (var j=0; j<state.points.length; j++) {
        var polygon = state.points[j];
        var newPolygon = [];
        for (var k=0; k<polygon.length; k++) {
          var point = polygon[k];
          var x = point[0] * width;
          var y = point[1] * height;
          newPolygon.push([x, y]);
        }
        newPoints.push(newPolygon);
      }
      _this.states[i].newPoints = newPoints;
    }
  };

  MainApp.prototype.onScroll = function(){
    var bbox = this.$viz[0].getBoundingClientRect();
    this.offsetY = bbox.y;
    this.offsetX = bbox.x;
  };

  MainApp.prototype.play = function(x, y){
    var found = false;
    var states = this.states;

    for (var i=0; i<states.length; i++) {
      var state = states[i];
      for (var j=0; j<state.newPoints.length; j++) {
        var polygon = state.newPoints[j];
        if (isInside([x, y], polygon)) {
          found = state;
          break;
        }
      }
      if (found !== false) {
        break;
      }
    }

    // check for no change
    if (found === false && this.lastState === false || found !== false && found.state === this.lastState) {
      return;
    }

    if (found === false) {
      this.lastState = false;
      this.$label.html('');
      this.queueAudio(false);
      return;
    }

    this.lastState = found.state;
    this.$label.html('<p>'+found.city+', '+found.state+'</p><p>'+found.date+'</p>');
    this.queueAudio('audio/'+found.state+'.mp3');
  };

  MainApp.prototype.queueAudio = function(filename) {

  };

  MainApp.prototype.render = function(){
    var _this = this;

    if (this.listening) {
      var x = this.pointerX - this.offsetX;
      var y = this.pointerY - this.offsetY;

      if (x !== this.lastX || y !== this.lastY) {
        this.lastX = x;
        this.lastY = y;
        this.move(x, y);
        this.play(x, y);
      }
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
