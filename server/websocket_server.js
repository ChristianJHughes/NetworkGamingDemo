// websocket_server.js
//
// SUMMARY: Contains all of the server side code for Monster Bash 2. Communicates with the individual clients, keeping all instances properly in sync.
//
// By: Christian J. Hughes

// Helper funciton for clamping a value between a min and max
function clamp(value, min, max) {
  return (value < min ? min : (value > max ? max : value));
}

// Global variables
var playerCount = 0,
    players = [],
    PORT = 4222;

var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({port: PORT});

wss.on('connection', function(ws) {

  // Create our new player
  var player = {
       id: playerCount,
       x: playerCount * 150,
       y: 430,
       size: 8,
       color: '#' + Math.floor(Math.random()*16777216).toString(16),
       ws: ws
    }

    // Send the new player their ID, and their x value on the map.
    ws.send(JSON.stringify({type: 'your-id', id: player.id, x: player.x}));

    // Add the new player to the player list
    players[playerCount] = player;
    playerCount++;

    // Send the player the svg, so that the world can be rendered.
    ws.send(JSON.stringify({type: 'world-svg', svg: getCurrentSVGString()}));

    // Notify new player of existing players
    players.forEach( function(existingPlayer) {
      if (existingPlayer !== player)
      {
        ws.send(JSON.stringify({
          type: 'player-joined',
          id: existingPlayer.id,
          x: existingPlayer.x,
          y: existingPlayer.y,
          size: existingPlayer.size,
          color: existingPlayer.color
        }));
      }
    });

    // Notify everyone of the new player
    players.forEach( function(existingPlayer) {
      existingPlayer.ws.send(JSON.stringify({
        type:'player-joined',
        id: player.id,
        x: player.x,
        y: player.y,
        size: player.size,
        color: player.color,
        playerRectangles: getCurrentPlayerPositions()
      }));
    });

    // Handle the websocket closing event
    ws.on('close', function() {
      // Remove the player from our game state
      players.splice(players.indexOf(player), 1);
      playerCount--;
      // Notify remaining players that this player left
      players.forEach( function(remainingPlayer) {
        remainingPlayer.ws.send(JSON.stringify({
          type: 'player-left',
          id: player.id,
          playerRectangles: getCurrentPlayerPositions()
        }));
        if (players.indexOf(remainingPlayer) >= player.id)
        {
          remainingPlayer.id -= 1;
        }
      });

    });

    // Handle websocket messages
    ws.on('message', function(json) {
      var message = JSON.parse(json);
      console.log('received: %s', message.type);

      // Handle messages by type
      switch(message.type) {

        case('move'):
          // Grab the appropriate player
          var player = players[message.id];

          // Move the player
          // player.x += clamp(message.x, -10, 10);
          player.x += message.x;

          // Notify everyone of the new state
          players.forEach( function (recipient) {
            recipient.ws.send(JSON.stringify({
              type:'player-moved',
              id: player.id,
              x: player.x,
              y: player.y,
              playerRectangles: getCurrentPlayerPositions()
            }));
          });
          break;
        case('player-attacked'):
          destructionPaths = message.pathDestroyed;
          // Tell everyone to update thier worlds upon one player attacking.
          players.forEach( function(existingPlayer) {
            existingPlayer.ws.send(JSON.stringify({
              type:'other-player-attacked',
              newPath: message.pathDestroyed
            }));
          });
          break;
      }
    });
});

var playerRectangles = ""; // The paths making up the players.
var destructionPaths = ""; // The paths making up the destoryed areas of the map.
var svgString = ""; // The entire SVG world as a string.

// Returns a string containing the current SVG for the entire world. To be called by each client as they start the game.
function getCurrentSVGString()
{
  svgString="";
  svgString += "<svg xmlns=\"http:\/\/www.w3.org\/2000\/svg\"";
  svgString += "      xmlns:xlink=\"http:\/\/www.w3.org\/1999\/xlink\"";
  svgString += "      viewBox=\"0 0 750 480\"";
  svgString += "      id=\"svg-canvas\" width=\"750px\" height=\"480px\">";
  svgString += "";
  svgString += "      <!--The sky colored background. Woohoo!-->";
  svgString += "      <rect x=\"0\" y=\"0\" width=\"1100\" height=\"480\" fill=\"#E0FFFF\"\/>";
  svgString += "";
  svgString += "      <!--Defines the black buildings.-->";
  svgString += "      <g id=\"Uzoma\" transform=\"scale(1.5) translate(100, -80)\">";
  svgString += "        <path id=\"pathID\" d=\"M5 400 L5 340 L90 340 L90 400 M15 340 L15 280 L80 280 L80 340 M25 280 L25 220 L70 220 L70 280\" stroke=\"black\"><\/path>";
  svgString += "      <\/g>";
  svgString += "";
  svgString += "      <!--Defines the white buildings.-->";
  svgString += "      <g id='habeebr' transform=\"scale(0.3) translate(-400, 620)\">";
  svgString += "      <path d=\"M459 981\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path>";
  svgString += "      <path d=\"M459 981\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 981 Z\" stroke=\"rgba(0,0,0,0)\" fill=\"#EEE\"><\/path>";
  svgString += "      <path d=\"M459 981 L459 966 L459 951 L459 936 L459 921 L459 906 L459 891 L459 876 L459 861 L459 846 L459 831 L459 816 L459 801 L459 786 L459 771 L459 756 L459 741 L459 726 L459 711 L459 696 L459 681 L459 666 L459 651 L459 636 L459 621 L459 606 L459 591 L459 576 L459 561 L459 546 L459 531 L459 516 L470 505 L470 490 L470 475 L470 460 L470 445 L470 430 L470 415 L470 400 L470 385 L470 370 L470 355 L470 340 L470 325 L470 310 L470 295 L470 280 L470 265 L470 250 L470 235 L470 220 L470 205 L470 190 L470 175 L470 160 L470 145 L470 130 L470 115 L470 100 L470 85 L470 70 L470 55 L470 40 L480 30 L495 30 L510 30 L525 30 L540 30 L555 30 L570 30 L585 30 L600 30 L615 30 L630 30 L645 30 L660 30 L675 30 L690 30 L705 30 L720 30 L731 40 L731 55 L731 70 L731 85 L731 100 L731 115 L731 130 L731 145 L731 160 L731 175 L731 190 L731 205 L731 220 L731 235 L731 250 L731 265 L731 280 L731 295 L731 310 L731 325 L731 340 L731 355 L731 370 L731 385 L731 400 L731 415 L731 430 L731 445 L731 460 L731 475 L731 490 L731 505 L741 516 L741 531 L741 546 L741 561 L741 576 L741 591 L741 606 L741 621 L741 636 L741 651 L741 666 L741 681 L741 696 L741 711 L741 726 L741 741 L741 756 L741 771 L741 786 L741 801 L741 816 L741 831 L741 846 L741 861 L741 876 L741 891 L741 906 L741 921 L741 936 L741 951 L741 966 L741 981 Z\" stroke=\"#AAA\" fill=\"#EEE\"><\/path>";
  svgString += "      <path d=\"M459 981 L459 966 L459 951 L459 936 L459 921 L459 906 L459 891 L459 876 L459 861 L459 846 L459 831 L459 816 L459 801 L459 786 L459 771 L459 756 L459 741 L459 726 L459 711 L459 696 L459 681 L459 666 L459 651 L459 636 L459 621 L459 606 L459 591 L459 576 L459 561 L459 546 L459 531 L459 516\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 516 L474 516 L489 516 L504 516 L519 516 L534 516 L549 516 L564 516 L579 516 L594 516 L609 516 L624 516 L639 516 L654 516 L669 516 L684 516 L699 516\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path>";
  svgString += "      <path d=\"M459 516\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path>";
  svgString += "      <path d=\"M459 516 L470 505\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path>";
  svgString += "      <path d=\"M469 505 L485 505 L500 505 L515 505 L530 505 L545 505 L560 505 L575 505 L590 505 L605 505 L620 505 L635 505 L650 505 L665 505 L680 505 L695 505 L710 505\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path>";
  svgString += "      <path d=\"M459 981 L459 966 L474 966\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 966 L459 951 L474 951\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path>";
  svgString += "      <path d=\"M459 951 L459 936 L474 936\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M474 936 L489 936\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path>";
  svgString += "      <path d=\"M489 936 L504 936\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 936 L459 921 L474 921\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path>";
  svgString += "      <path d=\"M474 921 L489 921\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M489 921 L504 921\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path>";
  svgString += "      <path d=\"M459 921 L459 906 L474 906\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 906 L459 891 L474 891\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path>";
  svgString += "      <path d=\"M459 891 L459 876 L474 876\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M474 876 L489 876\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path>";
  svgString += "      <path d=\"M489 876 L504 876\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M504 876 L519 876\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path>";
  svgString += "      <path d=\"M519 876 L534 876\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M534 876 L549 876\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path>";
  svgString += "      <path d=\"M549 876 L564 876\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 876 L459 861 L474 861\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path>";
  svgString += "      <path d=\"M474 861 L489 861\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M489 861 L504 861\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path>";
  svgString += "      <path d=\"M504 861 L519 861\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M519 861 L534 861\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path>";
  svgString += "      <path d=\"M534 861 L549 861\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M549 861 L564 861\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path>";
  svgString += "      <path d=\"M459 861 L459 846 L474 846\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 846 L459 831 L474 831\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path>";
  svgString += "      <path d=\"M459 831 L459 816 L474 816\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M474 816 L489 816\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path>";
  svgString += "      <path d=\"M489 816 L504 816\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 816 L459 801 L474 801\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path>";
  svgString += "      <path d=\"M474 801 L489 801\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M489 801 L504 801\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path>";
  svgString += "      <path d=\"M459 801 L459 786 L474 786\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 786 L459 771 L474 771\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path>";
  svgString += "      <path d=\"M459 771 L459 756 L474 756\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M474 756 L489 756\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path>";
  svgString += "      <path d=\"M489 756 L504 756\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M504 756 L519 756\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path>";
  svgString += "      <path d=\"M519 756 L534 756\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M534 756 L549 756\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M549 756 L564 756\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M564 756 L579 756\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M579 756 L594 756\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M594 756 L609 756\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M609 756 L624 756\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M624 756 L639 756\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M639 756 L654 756\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M654 756 L669 756\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M669 756 L684 756\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 756 L459 741 L474 741\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M474 741 L489 741\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M489 741 L504 741\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M504 741 L519 741\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M519 741 L534 741\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M534 741 L549 741\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M549 741 L564 741\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M564 741 L579 741\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M579 741 L594 741\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M594 741 L609 741\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M609 741 L624 741\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M624 741 L639 741\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M639 741 L654 741\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M654 741 L669 741\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M669 741 L684 741\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 741 L459 726 L474 726\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 726 L459 711 L474 711\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 711 L459 696 L474 696\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M474 696 L489 696\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M489 696 L504 696\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 696 L459 681 L474 681\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M474 681 L489 681\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M489 681 L504 681\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 681 L459 666 L474 666\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 666 L459 651 L474 651\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 651 L459 636 L474 636\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M474 636 L489 636\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M489 636 L504 636\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M504 636 L519 636\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M519 636 L534 636\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M534 636 L549 636\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M549 636 L564 636\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 636 L459 621 L474 621\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M474 621 L489 621\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M489 621 L504 621\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M504 621 L519 621\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M519 621 L534 621\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M534 621 L549 621\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M549 621 L564 621\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 621 L459 606 L474 606\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 606 L459 591 L474 591\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 591 L459 576 L474 576\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M474 576 L489 576\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M489 576 L504 576\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 576 L459 561 L474 561\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M474 561 L489 561\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M489 561 L504 561\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 561 L459 546 L474 546\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 546 L459 531 L474 531\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 531 L459 516\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 516 L470 505 L470 490 L485 490\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 490 L470 475 L485 475\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 475 L470 460 L485 460\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M484 460 L500 460\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M499 460 L515 460\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 460 L470 445 L485 445\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M484 445 L500 445\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M499 445 L515 445\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 445 L470 430 L485 430\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 430 L470 415 L485 415\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 415 L470 400 L485 400\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M484 400 L500 400\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M499 400 L515 400\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M514 400 L530 400\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M529 400 L545 400\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M544 400 L560 400\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M559 400 L575 400\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 400 L470 385 L485 385\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M484 385 L500 385\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M499 385 L515 385\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M514 385 L530 385\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M529 385 L545 385\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M544 385 L560 385\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M559 385 L575 385\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 385 L470 370 L485 370\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 370 L470 355 L485 355\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 355 L470 340 L485 340\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M484 340 L500 340\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M499 340 L515 340\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 340 L470 325 L485 325\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M484 325 L500 325\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M499 325 L515 325\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 325 L470 310 L485 310\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 310 L470 295 L485 295\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 295 L470 280 L485 280\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M484 280 L500 280\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M499 280 L515 280\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M514 280 L530 280\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M529 280 L545 280\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M544 280 L560 280\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M559 280 L575 280\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M574 280 L590 280\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M589 280 L605 280\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M604 280 L620 280\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M619 280 L635 280\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M634 280 L650 280\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M649 280 L665 280\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M664 280 L680 280\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M679 280 L695 280\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 280 L470 265 L485 265\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M484 265 L500 265\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M499 265 L515 265\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M514 265 L530 265\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M529 265 L545 265\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M544 265 L560 265\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M559 265 L575 265\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M574 265 L590 265\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M589 265 L605 265\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M604 265 L620 265\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M619 265 L635 265\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M634 265 L650 265\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M649 265 L665 265\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M664 265 L680 265\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M679 265 L695 265\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 265 L470 250 L485 250\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 250 L470 235 L485 235\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 235 L470 220 L485 220\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M484 220 L500 220\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M499 220 L515 220\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 220 L470 205 L485 205\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M484 205 L500 205\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M499 205 L515 205\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 205 L470 190 L485 190\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 190 L470 175 L485 175\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 175 L470 160 L485 160\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M484 160 L500 160\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M499 160 L515 160\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M514 160 L530 160\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M529 160 L545 160\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M544 160 L560 160\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M559 160 L575 160\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 160 L470 145 L485 145\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M484 145 L500 145\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M499 145 L515 145\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M514 145 L530 145\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M529 145 L545 145\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M544 145 L560 145\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M559 145 L575 145\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 145 L470 130 L485 130\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 130 L470 115 L485 115\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 115 L470 100 L485 100\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M484 100 L500 100\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M499 100 L515 100\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 100 L470 85 L485 85\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M484 85 L500 85\" stroke=\"#AAA\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M499 85 L515 85\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 85 L470 70 L485 70\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 70 L470 55 L485 55\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M469 55 L470 40\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 981\" stroke=\"rgba(0,0,0,0)\" fill=\"rgba(0,0,0,0)\"><\/path><path d=\"M459 981\"><\/path>";
  svgString += "      <\/g>";
  svgString += "";
  svgString += "      <!--Make additional instantiations of the two buildings.-->";
  svgString += "      <use x=\"170\" y=\"0\" xlink:href=\"#Uzoma\" \/>";
  svgString += "      <use x=\"200\" y=\"0\" xlink:href=\"#Uzoma\" \/>";
  svgString += "      <use x=\"500\" y=\"0\" xlink:href=\"#habeebr\" \/>";
  svgString += "      <use x=\"500\" y=\"0\" xlink:href=\"#Uzoma\" \/>";
  svgString += "      <use x=\"800\" y=\"0\" xlink:href=\"#habeebr\" \/>";
  svgString += "      <use x=\"840\" y=\"0\" xlink:href=\"#habeebr\" \/>";
  svgString += "      <use x=\"900\" y=\"0\" xlink:href=\"#Uzoma\" \/>";
  svgString += "";
  svgString += "      <!--This will serve to \"mask\" the buildings (by drawig a sky colored circle)-->";
  svgString += "      <g id=\"masking\" fill=\"#E0FFFF\">";
  svgString += destructionPaths;
  svgString += "<\/g>";
  svgString += "";
  svgString += "<g id=\"gPlayerID\">";
  svgString += getCurrentPlayerPositions();
  svgString += "<\/g>";
  svgString += "      <!--Defines the \"reticle\" that the player can use to aim and destroy nearby buildings.-->";
  svgString += "      <g id=\"reticule\" transform=\"translate(320, 240) scale(0.65)\">";
  svgString += "        <circle cx=\"0\" cy=\"0\" r=\"50\" stroke=\"#ff0000\" fill=\"none\"\/>";
  svgString += "        <circle cx=\"0\" cy=\"0\" r=\"25\" stroke=\"#ff0000\" fill=\"none\"\/>";
  svgString += "        <circle cx=\"0\" cy=\"0\" r=\"5\" stroke=\"#ff0000\" fill=\"none\"\/>";
  svgString += "        <path d=\"M -55 0 L 55 0\" stroke=\"#ff0000\"\/>";
  svgString += "        <path d=\"M 0 -55 L 0 55\" stroke=\"#ff0000\"\/>";
  svgString += "      <\/g>";
  svgString += "";
  svgString += "    <\/svg>";
  return svgString;
};

// Creates a string containing all of the player paths (in SVG format).
function getCurrentPlayerPositions()
{
  playerRectangles = "";
  players.forEach( function(i)
  {
    playerRectangles += "<rect x='" + i.x + "' y='" + i.y + "' width='50' height='50' fill='" + i.color + "' id='" + i.id + "'/>";
  });
  return playerRectangles;
};
