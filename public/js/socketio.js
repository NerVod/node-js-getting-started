const io = require("socket.io");
const Server = io.Server;
const ioServer = new Server(httpServer);
const randomColor = require("randomcolor");
const { setInterval } = require("timers");

const allPlayers = {};
let sensPoupee = true;
let partieEnCours = false;

ioServer.on("connection", (socket) => {
  // console.log("io connecté avec cookie:" + socket.request.headers.cookie);

  let uniquePlayer = socket.request.headers.cookie;
  let parsedToken = uniquePlayer.substring(13);
  // console.log("parsedToken", parsedToken);
  let dataJoueur = jwt.verify(parsedToken, process.env.JWTPRIVATEKEY);
  // console.log(dataJoueur["id"]);
  // console.log(dataJoueur["gamertag"]);
  // console.log(dataJoueur["victories"]);

  ///////////////////////  création du joueur à la connexion //////////////////////
  const onePlayer = {
    id: dataJoueur["id"],
    gamertag: dataJoueur["gamertag"],
    victories: dataJoueur["victories"],
    width: "100px",
    height: "100px",
    top: 255 + Math.random() * 500 + "px",
    left: "30px",
    position: "absolute",
    backgroundColor: randomColor(),
  };

  ////////////// iD unique pour chaque connexion et envoi à tous les sockets
  allPlayers[onePlayer.id] = onePlayer;
  allPlayers[onePlayer.gamertag] = onePlayer;

  ioServer.emit("updateOrCreatePlayer", onePlayer);

  for (playerId in allPlayers) {
    const player = allPlayers[playerId];

    ioServer.emit("updateOrCreatePlayer", player);
  }

  ////////////// déplacement à la souris///////////////////////
  let startToggle;

  socket.on("start", () => {
    for (playerId in allPlayers) {
      const player = allPlayers[playerId];

      ioServer.emit("updateOrCreatePlayer", player);
    }
    partieEnCours = true;
    hideStart();
    rebase();
    startToggle = setInterval(retournerPoupee, 2000);
  });

  socket.on("join", () => {
    partieEnCours = true;
    rebase();
  });

  function retournerPoupee() {
    if (partieEnCours) {
      valeur = -valeur;
      if (valeur === 1) {
        value = "scaleX(1)";
        sensPoupee = true;
        ioServer.emit("begin", value, sensPoupee);
      } else {
        value = "scaleX(-1)";
        sensPoupee = false;
        ioServer.emit("begin", value, sensPoupee);
      }
      // console.log("valeur du scalex :", valeur);
    }
  }

  function stopToggle(timer) {
    clearInterval(timer);
    value = "scaleX(1)";
    sensPoupee = true;
    partieEnCours = false;
    ioServer.emit("begin", value);
  }

  socket.on("mousemove", (position) => {
    onePlayer.top =
      parseFloat(position.y) - parseFloat(onePlayer.height) / 2 + "px";

    if (
      parseFloat(position.x) <=
      parseFloat(onePlayer.left) + parseFloat(onePlayer.width)
    ) {
      onePlayer.left =
        parseFloat(position.x) - parseFloat(onePlayer.width) / 2 + "px";
      console.log("joueur :", onePlayer.id);
    }

    if (parseFloat(onePlayer.top) < 260 || parseFloat(onePlayer.top) > 1060)
      return;
    if (parseFloat(onePlayer.left) < 5 || parseFloat(onePlayer.left) > 1510)
      return;

    if (sensPoupee && parseFloat(onePlayer.left) < 1200) {
      onePlayer.left = 30 + "px";
    }

    ////////////////////////////////////////////////////////////////////////////////////////
    /////////////// Condition de Victoire : dépassement poupée

    for (playerId in allPlayers) {
      const player = allPlayers[playerId];
      if (parseFloat(player.left) > 1100) {
        // console.log(onePlayer.id, " à dépassé la poupée ");
        showStart();
        stopToggle(startToggle);
        addOneVictory(player);
        // console.log("winner", player["gamertag"]);
      }
    }
    ioServer.emit("updateOrCreatePlayer", onePlayer);
  });

  /////////////////////////////////////////////////////////////////////////////////////
  ///////// gestion démarrage partie et fonctions inversion sens poupée  ///////////

  let valeur = 1;
  let value = `scaleX(${valeur})`;

  let boutonValue = "visible";

  function hideStart() {
    for (playerId in allPlayers) {
      boutonValue = "hidden";
      ioServer.emit("hide", boutonValue);
      return boutonValue;
    }
  }

  /////// réapparition bouton start quand un joueur attend l'arrivée ///////////
  function showStart() {
    for (playerId in allPlayers) {
      boutonValue = "visible";
      ioServer.emit("hide", "visible");
      return boutonValue;
    }
  }

  function rebase() {
    for (playerId in allPlayers) {
      onePlayer.left = "30px";
    }
    ioServer.emit("updateOrCreatePlayer", onePlayer);
  }
  ////// fonction gangnant//////////////

  const addOneVictory = async function (winner) {
    let victories = await Database.User.findOne({
      gamertag: dataJoueur["gamertag"],
    });
    // console.log('objet victories soit le joueur :', victories)
    // console.log('victoires dans mongo avant ajout score',victories['victories'])

    victories = victories["victories"];
    console.log("victories :", victories);
    let nouvelleVictoire = parseFloat(victories) + 1;
    // console.log('nouvellevictoire :', nouvelleVictoire)

    const gagnant = await Database.User.findOneAndUpdate(
      { gamertag: dataJoueur["gamertag"] },
      { victories: `${nouvelleVictoire}` },
      { new: true },
      console.log(
        "victoire ajoutée :" +
          `${dataJoueur["gamertag"]}` +
          " " +
          `${nouvelleVictoire}`
      )
    );
    console.log("gagnant", gagnant);
    partieEnCours = false;
    return partieEnCours;
  };

  ////////////// supression jes joueurs à la déconnexion du socket////////////////
  socket.on("disconnect", () => {
    delete allPlayers[onePlayer.id];
    ioServer.emit("removePlayer", onePlayer);
  });
  socket.on("disconnect", () => {
    stopToggle(startToggle);
    ioServer.emit("begin", onePlayer);
  });
});
