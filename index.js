// const cool = require("cool-ascii-faces");
// const express = require("express");
// const path = require("path");
// const PORT = process.env.PORT || 5000;

// express()
//   .use(express.static(path.join(__dirname, "public")))
//   .set("views", path.join(__dirname, "views"))
//   .set("view engine", "ejs")
//   .get("/", (req, res) => res.render("pages/index"))
//   .get("/cool", (req, res) => res.send(cool()))
//   .listen(PORT, () => console.log(`Listening on ${PORT}`));

  const express = require("express");
const path = require("path");
const cors = require("cors");
const Database = require("./public/js/db");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const Cookies = require("cookies");
const objetIp = require("./public/js/ip");
const Mongoose = require("mongoose");
require("dotenv").config();
const port = process.env.PORT || 5000;
const favicon = require("serve-favicon");
const app = express();

// détecter ip serveur à placer dans js client

console.log("résultats recherche ip objet :", objetIp);
console.log("résultats recherche ip :", objetIp["results"]["Ethernet 2"][0]);

app.use("/css", express.static(path.join(__dirname, "public/css")));
app.use("/js", express.static(path.join(__dirname, "public/js")));
app.use("/img", express.static(path.join(__dirname, "public/images")));
app.use("/.ttf", express.static(path.join(__dirname, "public/font")));
app.use("/.pug", express.static(path.join(__dirname, "views")));
app.use("/favicon.ico", express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

app.set("view-engine", "pug");

app.get("/", (req, res) => {
  res.send("index.html");
});

// app.get("/", (req, res) => {
//   res.render("accueil.pug");
// });
app.get("/register", (req, res) => {
  res.render("register.pug");
});

app.get("/jeu", (req, res) => {
  let cookie = req.headers.cookie;
  if (cookie) {
    res.render("jeu.pug");
  } else {
    res.render("accueil.pug", {
      message: "Erreur d'identifiants route /jeu, Veuillez vous enregistrer !",
    });
  }
});

const hallOfFame = [];

app.get("/highscore", (req, res) => {
  (async () => {
    Database.User.find({}, { _id: 0, gamertag: 1, victories: 1 })
      .sort({ victories: -1 })
      .limit(10)
      .then((winners) => {
        console.log("log sur route highscore", winners);
        hallOfFame.splice(0);
        for (let i = 0; i < winners.length; i++) {
          hallOfFame.push(winners[i]);
          console.log("push hall of fame :", hallOfFame);
        }
        console.log("hallOfFame après bouclage :", hallOfFame);
      });
  })().then(
    res.render("highscore.pug", {
      premier: `${hallOfFame[0]}`,
      deuxieme: `${hallOfFame[1]}`,
      troisieme: `${hallOfFame[2]}`,
      quatrieme: `${hallOfFame[3]}`,
      cinquieme: `${hallOfFame[4]}`,
      sixieme: `${hallOfFame[5]}`,
      septieme: `${hallOfFame[6]}`,
      huitieme: `${hallOfFame[7]}`,
      neuvieme: `${hallOfFame[8]}`,
      dixieme: `${hallOfFame[9]}`,
    })
  );
});

app.get("*", (req, res) => {
  res.render("404.pug");
});

///////////////////////////////// création du compte utilisateur
app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    // res.json({ success: false, error: 'Veuillez vous identifier'})
    res.render("register.pug", {
      message: "Veuillez vous identifier !",
    });
    return;
  }

  Database.User.findOne({ email: req.body.email }).then((user) => {
    if (user) {
      res.render("register.pug", {
        message: "Cet email existe déjà, Veuillez en saisir un nouveau !",
      });
    } else {
      Database.User.create({
        email: req.body.email,
        gamertag: req.body.gamertag,
        password: bcrypt.hashSync(req.body.password, salt),
        victories: 0,
      })
        .then((user) => {
          console.log("compte créé dans BDD");
          const token = jwt.sign(
            { id: user._id, email: user.email, gamertag: user.gamertag },
            process.env.JWTPRIVATEKEY
          );
          console.log("token créé à la création du compte :", token);
          // res.json({ success: true, token: token })
          res.setHeader("Authorization", "Bearer " + token);
          res.render("accueil.pug", {
            message: "Vous pouvez commencer la partie !",
          });
        })
        .catch((err) => {
          // res.json({ success: false, error : err})
          console.error(err);
          res.render("register.pug", {
            message: "Erreur d'identification, veuillez recommencer !",
          });
        });
    }
  });
});

///////////////// connexion au compte utilisateur/////////////////////////////////////

app.post("/login", (req, res) => {
  if (!req.body.email || !req.body.password) {
    // res.json({ success: false, error: 'Veuillez vous enregistrer'})
    res.render("accueil.pug", {
      message: "Veuillez vous connecter !",
    });
    return;
  }

  Database.User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        // res.json({ success: false, error: "Pas de compte sur cet email"})
        res.render("register.pug", {
          message: "Pas de compte sur cet email, Veuillez vous enregistrer !",
        });
      } else {
        if (!bcrypt.compareSync(req.body.password, user.password)) {
          // res.json({success: false, error: 'Mot de passe incorrect'})
          res.render("accueil.pug", {
            message: "Erreur d'identifiants, Veuillez vous enregistrer !",
          });
        } else {
          let leJoueur = Object.values(user);
          let gamertag = leJoueur[2].gamertag;
          let victories = leJoueur[2].victories;
          let token = jwt.sign(
            {
              id: user._id,
              email: user.email,
              gamertag: `${gamertag}`,
              victories: `${victories}`,
            },
            process.env.JWTPRIVATEKEY
          );

          console.log(gamertag);
          console.log("token après login dans route post:", token);

          new Cookies(req, res).set("access_token", token, {
            httpOnly: false,
            MaxAge: 1000 * 60 * 60,
          });
          res.render("jeu.pug");
        }
      }
    })
    .catch((err) => {
      // res.json({ success: false, error: err})
      console.error(err);
      res.render("accueil.pug", {
        message:
          "Erreur lors de l'identification, connectez-vous ou créez un compte !",
      });
    });
});

const httpServer = app.listen(port, () => {
  console.log(`Le serveur écoute le port ${port}`);
});