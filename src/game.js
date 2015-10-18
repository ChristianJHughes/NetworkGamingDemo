// game.js
//
// SUMMARY: Contains all of the client side code for Monster Bash 2. Communicates with the server side 'websocket_server.js' code in order to run the game in multiple instances.
//
// By: Christian J. Hughes

var WebSocket = require('ws'),
    PORT = 4222;

// Wait for the window to load completely
window.onload = function() {

  // Players
  var myId,
    players = [];

  var svg,
      sprite,
      mask,
      gPlayers,
      xScroll = 0,
      yScroll = 0,
      characterX,
      x, y;

  // Set up the websocket client
  ws = new WebSocket('ws://cislinux.cis.ksu.edu:' + PORT);

  // Handler for websocket messages
  ws.onmessage = function(msg) {
    var message = JSON.parse(msg.data);

    switch(message.type) {
      case('your-id'):
        myId = message.id;
        characterX = message.x;
        break;
      case('player-joined'):
        // When a new player joins, add them to the player array
        players[message.id] = {
          x: message.x,
          y: message.y,
          size: message.size,
          color: message.color
        };
        gPlayers.innerHTML = message.playerRectangles;
        break;
      case('player-moved'):
        // When a player has moved, store their new position
        players[message.id].x = message.x;
        players[message.id].y = message.y;
        gPlayers.innerHTML = message.playerRectangles;
        break;
      case('player-left'):
        // When a player leaves, remove them from the player array
        players.splice(players.indexOf(players[message.id]), 1);
        if (myId > message.id)
        {
          myId -= 1;
        }
        gPlayers.innerHTML = message.playerRectangles;
        break;
      case('world-svg'): // Send the player the initial state of the world, and create event listeners for player events.
        // This message will be sent upon inital connection. It contains the current state of the world as an SVG.
        document.getElementById("svgGoesHere").innerHTML = message.svg;
        const NS = "http://www.w3.org/2000/svg";
        svg = document.getElementById("svg-canvas");
        sprite = document.getElementById("reticule");
        character = document.getElementById(myId);
        mask = document.getElementById("masking");
        gPlayers = document.getElementById("gPlayerID"); // The group tag for the player paths.
        xScroll = 0;
        yScroll = 0;
        // characterX = 0;

        // Move the reticle to the mouse position
        // by applying
        window.onmousemove = function(event) {
          // Calculate the x position by adjusting the
          // reported mouse position by the position of
          // the SVG in the client area and accounting
          // for scroll of the window and the SVG viewbox
          x = event.clientX - svg.offsetLeft + window.scrollX + xScroll;
          // Do the same for the y position
          y = event.clientY - svg.offsetTop + window.scrollY + yScroll;
          // Apply the new position as a transformation
          // on the sprite's group:
          sprite.setAttributeNS(null, "transform", "translate("+x+","+y+") scale(0.65)");
        }

        // Keeps track of where the reticle should be on screen, and delegates "masking."
        window.onmouseup = function(event) {
          x = event.clientX - svg.offsetLeft + window.scrollX + xScroll;
          y = event.clientY - svg.offsetTop + window.scrollY + yScroll;
          var hole = document.createElementNS(NS, "path");
          hole.setAttributeNS(null, "d", "M " + x + " " + (y-36) + " a 36 36 0 1 0 0.0001 0z");
          mask.appendChild(hole);
          ws.send(JSON.stringify({type: "player-attacked", pathDestroyed: mask.innerHTML}));
        }

        // Keeps track of input for player movement.
        window.onkeypress = function(event) {
          event.preventDefault();
          var otherPlayerHit = false;
          var playerPositions = [];
          players.forEach( function(i) {
            playerPositions.push(i.x);
          });

          switch(event.keyCode) {
            case 100: // d, move the character right. Move the viewport if the character is against the right side of the screen.

              if (playerPositions.indexOf(characterX + 50) !== -1)
              {
                otherPlayerHit = true;
              }

              if (characterX <= 1040 && !otherPlayerHit)
              {
                characterX += 10;
                ws.send(JSON.stringify({
                  type: "move",
                  id: myId,
                  x: 10,
                  y: 0
                }));
                // Move the viewport as well. This will only be reflected for the individual client.
                if (characterX === 710 + xScroll)
                {
                  if (xScroll <= 340)
                  {
                  xScroll += 10;
                  }
                  svg.setAttributeNS(null, "viewBox", xScroll+" "+yScroll+" 750 480");
                  event.preventDefault();
                }
              }
              character.setAttributeNS(null, "transform", "translate(" + characterX + ", 0" + ")");
              break;
            case 97: // a, move the character left. Move the viewport if the character is against the left side of the screen.

              if (playerPositions.indexOf(characterX - 50) !== -1)
              {
                otherPlayerHit = true;
              }

              if (characterX >= 10 && !otherPlayerHit)
              {
                characterX -= 10;
                ws.send(JSON.stringify({
                  type: "move",
                  id: myId,
                  x: -10,
                  y: 0
                }));
                // Move the viewport as well. This will only be reflected for the individual client.
                if (characterX === -10 + xScroll)
                {
                  if (xScroll >= 10)
                  {
                    xScroll -= 10;
                  }
                  svg.setAttributeNS(null, "viewBox", xScroll+" "+yScroll+" 750 480");
                  event.preventDefault();
                }
              }
              character.setAttributeNS(null, "transform", "translate(" + characterX + ", 0" + ")");
              break;
          }
        }
        break;
      case('other-player-attacked'):
        // If another player attacked, then we want to update THIS players path. The message should contain the new path.
        mask.innerHTML = message.newPath;
        break;
    }
  }
};
