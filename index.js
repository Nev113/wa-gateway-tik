const { config } = require("dotenv");
const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");
const path = require("path");
const MainRouter = require("./app/routers");
const errorHandlerMiddleware = require("./app/middlewares/error_middleware");
const whatsapp = require("wa-multi-session");
const cron = require("node-cron");
const { format } = require("date-fns");
const { formatInTimeZone } = require("date-fns-tz");
const db = require("./db/db");
const { default: axios } = require("axios");
const { sendMessage } = require("./app/controllers/message_controller");

cron.schedule("* * * * * *", async () => {
    const data = db.get("schedules");
    await axios.get("https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json")
    .then((res) => {
      const dget = db.get("gempa");
      if (dget.jam == res.data.Infogempa.gempa.Jam) return;
      const data = res.data.Infogempa.gempa;
      const dataGempa = {
        tanggal: data.Tanggal,
        jam: data.Jam,
        lintang: data.Lintang,
        bujur: data.Bujur,
        magnitude: data.Magnitude,
        kedalaman: data.Kedalaman,
        wilayah: data.Wilayah,
        potensi: data.Potensi,
        shakemap: data.Shakemap,
        ready: false
      };
      db.set("gempa", dataGempa);
    })
    let dataGempa = db.get("gempa");
    if (dataGempa) {
          dataGempa = db.get("gempa");
        if (dataGempa.ready == false) {
          console.log("sendingg")
          whatsapp.sendTextMessage({
            sessionId: "client1",
            to: "6283806211924",
            text: "Gempa ngentooooooooot tangi bangsaaat \ntanggal: " + dataGempa.tanggal + "\nJam: " + dataGempa.jam + "\nSher lok 1: " + dataGempa.lintang + "\nsher lok 2: " + dataGempa.bujur + "\nGeyal Geyol: " + dataGempa.magnitude + "\nDaleeeem: " + dataGempa.kedalaman + "\nWilayah: " + dataGempa.wilayah + "/Umahe Ira" + "\nPotensi: " + dataGempa.potensi + "/ tsunami (Rongokna bolor e)" + "\n tobatlah kawan sesungguhnya orang yang tobat adalah orang yang bertaubat #StopJajanSembarangan",
          });
          whatsapp.sendImage({
            sessionId: "client1",
            to: "6283806211924",
            text: new Date().toString(),
            media: "https://data.bmkg.go.id/DataMKG/TEWS/"+dataGempa.shakemap,
          });
          db.delete("gempa");
          db.set("gempa", {...dataGempa, ready: true});
          console.log(db.get("gempa"))
        }
    }
    if (data) {
      data.forEach(async(dt) => {
        const date = new Date();
        const dateNow = formatInTimeZone(date,"Asia/Jakarta","yyy-MM-dd HH:mm:ss");
        const dateData = dt.date + " " + dt.time;
        if (dateData == dateNow) {
          const send = await whatsapp.sendTextMessage({
            sessionId: dt.session,
            to: dt.to,
            text: dt.text,
          });
        }
    })
}});

config();

var app = express();
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.set("view engine", "ejs");
// Public Path
app.use("/p", express.static(path.resolve("public")));
app.use("/p/*", (req, res) => res.status(404).send("Media Not Found"));

app.use(MainRouter);

app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || "5000";
app.set("port", PORT);
var server = http.createServer(app);
server.on("listening", () => console.log("APP IS RUNNING ON PORT " + PORT));

server.listen(PORT);

whatsapp.onConnected((session) => {
  console.log("connected => ", session);
});

whatsapp.onDisconnected((session) => {
  console.log("disconnected => ", session);
});

whatsapp.onConnecting((session) => {
  console.log("connecting => ", session);
});

whatsapp.loadSessionsFromStorage();
