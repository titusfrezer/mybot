const express = require("express");
const { webhookCallback } = require("grammy");
const { bot } = require("./index");

const domain = String(process.env.DOMAIN);
const secretPath = String(process.env.BOT_TOKEN);
const app = express();


app.use(express.json());
app.use(`/${secretPath}`, webhookCallback(bot, "express"));

app.listen(Number(process.env.PORT), async () => {
  console.log("listening" + process.env.BOT_TOKEN);

 
});
