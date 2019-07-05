const { google } = require("googleapis");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { JWT } = require("google-auth-library");
var key = require("./SunnyAssistant-74d16b5a45d5.json");
const request = require("request");
const uid2 = `ABwppHG_s1fRdOZYD5V2a-F10YFlbhiHa_i1RPOfSPRoV_Fgf7XFeNJUKUWpcL_hBU4Zy_AUwoj7K4A7pz2M`;
const {
  dialogflow,
  Suggestions,
  UpdatePermission,
  List,
  SimpleResponse,
  BasicCard,
  Button,
  Image
} = require("actions-on-google");
admin.initializeApp(functions.config().firebase);
const app = dialogflow({
  debug: true
});
var db = admin.database();
var ref = db.ref("/data/-Lj1rjEYF_8YXfQAexWy/radiation");
app.intent("Radiacion", conv => {
  conv.ask("Estoy consultando la radiacion...");
  return ref.limitToFirst(1).once("value", snap => {
    var radiation = snap.val();
    var msj = "";
    if (300 <= radiation <= 450) msj = "Moderada";
    else if (451 <= radiation <= 500) msj = "Alta";
    else if (501 <= radiation <= 650) msj = "Muy Alta";
    else if (radiation > 651) msj = "Extrema";
    else msj = "Bajo";
    conv.ask("La radiación es " + msj);
    conv.ask("Para mas información visita nuestra pagina web.");
    let card = null;
    card = new BasicCard({
      text: `Revisa las recomendaciones para este nivel de radiación`,
      subtitle: `La radiación es ${msj}`,
      title: `Informe de radiación`,
      buttons: new Button({
        title: "Ver en la web",
        url:
          "https://www.google.com/maps/dir/-0.259184,-78.522643/-0.252662,-78.521555/"
      }),
      image: new Image({
        url:
          "https://slideplayer.es/slide/3477026/12/images/3/Se+pens%C3%B3+que+el+inca+fue+un+descendiente+del+DIOS+del+SOL.jpg",
        alt: "Abrir para ver web"
      }),
      display: "DEFAULT"
    });
    conv.ask(card);
    conv.ask(`¿Quieres hacer algo más?`);
  });
});
app.intent("Notificaciones", conv => {
  conv.ask(
    new UpdatePermission({
      intent: "Radiacion"
    })
  );
});
app.intent("Notificaciones Final", (conv, params, granted) => {
  if (granted) {
    const userId = conv.arguments.get("UPDATES_USER_ID");
    console.log("userId", userId);
    conv.ask("Listo. Te estaré enviando notificaciones más tarde. Adios.");
  } else
    reply(
      conv,
      "Si quieres notificaciones puedes preguntarme más tarde. Adios."
    );
});
exports.onCreateRadiation = functions.database
  .ref("/data/{id}/radiation")
  .onCreate((snapshot, context) => {
    // Grab the current value of what was written to the Realtime Database.
    const radiation = snapshot.val();
    var msj = "Nivel de radiacion ";
    if (451 <= radiation <= 500) msj += "Alta. Te recomiendo ponerte protector solar.";
    else if (501 <= radiation <= 650) msj += "Muy Alta. Usa gorra, protector solar y toma muchos líquidos.";
    else if (radiation > 651) msj += "Extrema. Evita salir de la casa.";
    else return null;
    sendNotification(msj);
    return null;
  });

function sendNotification(msj) {
  let jwtClient = new JWT(
    key.client_email,
    null,
    key.private_key,
    ["https://www.googleapis.com/auth/actions.fulfillment.conversation"],
    null
  );

  jwtClient.authorize((authErr, tokens) => {
    let notification = {
      userNotification: {
        title: msj
      },
      target: {
        userId: uid2,
        intent: "Radiacion",
        // Expects a IETF BCP-47 language code (i.e. en-US)
        locale: "es-ES"
      }
    };

    request.post(
      "https://actions.googleapis.com/v2/conversations:send",
      {
        auth: {
          bearer: tokens.access_token
        },
        json: true,
        body: {
          customPushMessage: notification
        }
      },
      (reqErr, httpResponse, body) => {
        console.log(
          httpResponse.statusCode + ": " + httpResponse.statusMessage
        );
      }
    );
  });
}
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
