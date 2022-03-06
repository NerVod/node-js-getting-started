window.document.addEventListener("DOMContentLoaded", () => {
  console.log("index.js chargé");

  const updateOrCreatePlayer = (player) => {
    let divElement = window.document.getElementById(player.id);
    if (!divElement) {
      divElement = window.document.createElement("div");
      divElement.id = player.id;
      // window.document.getElementById('gameArea').appendChild(divElement);
      window.document.body.appendChild(divElement);
    }
    divElement.innerHTML = player.gamertag;
    divElement.style.top = player.top;
    divElement.style.left = player.left;
    divElement.style.width = player.width;
    divElement.style.height = player.height;
    divElement.style.position = player.position;
    divElement.style.backgroundColor = player.backgroundColor;
    return divElement;
  };

  if (typeof io !== "undefined") {
    const socket = /*io("https://squidsun.herokuapp.com/");*/
    io("http://192.168.1.19:3000") || io("http://localhost:8080");

    socket.on("updateOrCreatePlayer", (player) => {
      const playerElement = updateOrCreatePlayer(player);
    });

    socket.on("removePlayer", (player) => {
      const divElement = window.document.getElementById(player.id);
      if (divElement) {
        divElement.parentNode.removeChild(divElement);
      }
    });

    window.addEventListener("mousemove", (e) => {
      const position = {
        x: e.clientX,
        y: e.clientY,
      };
      socket.emit("mousemove", position);
    });
    ////////////////////////////////////
    const startGame = document.getElementById("startGame");
    const poupee = document.getElementById("poupee");

    startGame.addEventListener("click", () => {
      socket.emit("start");
    });

    socket.on("begin", (value) => {
      // begin the game :  démarre 123soleil coté serveur sur tous les screens
      poupee.style.transform = value;
    });

    socket.on("hide", (boutonValue) => {
      startGame.style.visibility = boutonValue;
    });

    socket.on("message", (messageSuServeur) => {
      console.log(messageSuServeur);
    });
  }
});
