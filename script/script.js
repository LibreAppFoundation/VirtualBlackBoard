var board = document.getElementById("board");
var brushCanvas = document.getElementById("brush");
var boardCtx = board.getContext('2d');
var brushCtx = brushCanvas.getContext('2d');


var cpanel = document.getElementById("controls");
var boardColor = document.getElementById("board-color");
var chalkColor = document.getElementById("chalk-color");
var eraser = document.getElementById("eraser");
var thickness = document.getElementById("thickness");


function setThickness() {

  var width = brushCanvas.width;
  var height = brushCanvas.height;

  brushCtx.clearRect(0, 0, width, height);
  brushCanvas.style.background = boardColor.value;

  brushCtx.fillStyle = chalkColor.value;
  brushCtx.beginPath();
  brushCtx.arc(width / 2, height / 2, thickness.value, 0, Math.PI * 2, true);
  brushCtx.fill();
}

function computeMaxThickness() {
  var thicknessToggle = document.getElementById("thickness-toggle");
  var brushWidth = thicknessToggle.clientWidth;
  var brushHeight = thicknessToggle.clientHeight;

  brushCanvas.width = brushWidth;
  brushCanvas.height = brushHeight;

  // Adjust position of control panel


  var maxThickness = brushWidth < brushHeight ? brushWidth : brushHeight;

  return maxThickness;
}

function changeBoardColor() {
  var color = boardColor.value;
  board.style.background = color;

  setThickness();
}

function changeChalkColor() {
  boardCtx.strokeStyle = chalkColor.value;
  boardCtx.fillStyle = chalkColor.value;
  setThickness();
}


function changeThickness() {
  boardCtx.lineWidth = thickness.value * 2;

  setThickness();
}

function clearBoard() {
  boardCtx.clearRect(0, 0, board.width, board.height);
}

function resetBoard() {

  boardCtx.lineCap = 'round';
  boardCtx.strokeStyle = chalkColor.value;
  boardCtx.fillStyle = chalkColor.value;
  boardCtx.lineWidth = thickness.value * 2;

  board.style.background = boardColor.value;
}

function adjustCanvas() {
  var body = document.body;
  var width = body.clientWidth;
  var height = body.clientHeight;


  board.width = width;
  board.height = height;

  cpanel.style.left = (width - cpanel.clientWidth) / 2 + "px";

  var maxThickness = computeMaxThickness() / 2;

  document.getElementById("thickness").setAttribute("max", maxThickness);

  changeThickness();

  resetBoard();
}



window.onload = function() {

  var mousedown = false;

  // Init values
  adjustCanvas();





  // Event handlers
  boardColor.onchange = changeBoardColor;
  chalkColor.onchange = changeChalkColor;
  eraser.onclick = clearBoard;
  thickness.onchange = changeThickness;

  document.getElementById("thickness-toggle").onclick = function() {
    if (this.display == undefined || this.display == false) {
      this.display = true;
      thickness.style.display = "block";
    } else {
      this.display = false;
      thickness.style.display = "none";
    }
  }

  board.addEventListener('mousedown', function(e) {
    mousedown = true;
    this.X = e.pageX;
    this.Y = e.pageY;
  }, 0);

  board.addEventListener('mouseup', function() {
    mousedown = false;
  });

  board.addEventListener('mousemove', function(e) {
    if (mousedown && !this.control) {
      boardCtx.beginPath();
      boardCtx.moveTo(this.X, this.Y);

      boardCtx.lineTo(e.pageX, e.pageY);
      boardCtx.stroke();

      this.X = e.pageX;
      this.Y = e.pageY;
    }
  });

  // Don't draw over control panel
  cpanel.addEventListener("mouseenter", function() {
    this.control = true;
  });

  cpanel.addEventListener("mouseleave", function() {
    this.control = false;
  });

  cpanel.addEventListener('mouseup', function() {
    mousedown = false;
  });

  document.getElementById("close").onclick = function() {
     var popupWindow = document.getElementById("popup-message-window");
    popupWindow.setAttribute("style", "z-index: -1; opacity: 0");
  }

  document.getElementById("about").onclick = function() {
    var popupWindow = document.getElementById("popup-message-window");
    popupWindow.setAttribute("style", "z-index: 1050; opacity: 1");
  }

  // Touch screen events;
  board.addEventListener("touchstart", handleStart, false);
  board.addEventListener("touchend", handleEnd, false);
  board.addEventListener("touchcancel", handleCancel, false);
  board.addEventListener("touchmove", handleMove, false);

  var ongoingTouches = new Array();

  function handleStart(e) {
    e.preventDefault();

    var ctx = board.getContext("2d");
    var touches = e.changedTouches;

    for (var i = 0; i < touches.length; i++) {
      ongoingTouches.push(copyTouch(touches[i]));
      ctx.beginPath();
      ctx.arc(touches[i].pageX, touches[i].pageY, thickness.value, 0, 2 * Math.PI, false);  // a circle at the start
      ctx.fill();
    }
  }

  function handleMove(e) {
    e.preventDefault();

    var touches = e.changedTouches;

    for (var i = 0; i < touches.length; i++) {
      var idx = ongoingTouchIndexById(touches[i].identifier);

      if (idx >= 0) {
        boardCtx.beginPath();
        boardCtx.moveTo(ongoingTouches[idx].pageX, ongoingTouches[idx].pageY);
        boardCtx.lineTo(touches[i].pageX, touches[i].pageY);
        boardCtx.stroke();

        ongoingTouches.splice(idx, 1, copyTouch(touches[i]));  // swap in the new touch record
      } else {
        console.log("can't figure out which touch to continue");
      }
    }
  }
  function handleEnd(e) {
    e.preventDefault();

    var touches = e.changedTouches;

    for (var i = 0; i < touches.length; i++) {
      var idx = ongoingTouchIndexById(touches[i].identifier);

      if (idx >= 0) {
        boardCtx.beginPath();
        boardCtx.moveTo(ongoingTouches[idx].pageX, ongoingTouches[idx].pageY);
        boardCtx.lineTo(touches[i].pageX, touches[i].pageY);
        boardCtx.fillRect(touches[i].pageX - 4, touches[i].pageY - 4, 8, 8);  // and a square at the end
        ongoingTouches.splice(idx, 1);  // remove it; we're done
      } else {
        console.log("can't figure out which touch to end");
      }
    }
  }

  function handleCancel(e) {
    e.preventDefault();
    var touches = e.changedTouches;

    for (var i = 0; i < touches.length; i++) {
      ongoingTouches.splice(i, 1);  // remove it; we're done
    }
  }

  function copyTouch(touch) {
    return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY };
  }

  function ongoingTouchIndexById(idToFind) {
    for (var i = 0; i < ongoingTouches.length; i++) {
      var id = ongoingTouches[i].identifier;

      if (id == idToFind) {
        return i;
      }
    }
    return -1;    // not found
  }

}

window.onresize = adjustCanvas;

