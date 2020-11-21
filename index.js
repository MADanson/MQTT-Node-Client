const mqtt = require("mqtt");
const axios = require("axios");
require('dotenv').config()
//const temp = require("pi-temperature");

//MQTT Connection
const client = mqtt.connect("mqtt://"+process.env.BROKER_IP, {username: "blinds", password: process.env.PASSKEY});
const timeApi = "http://worldtimeapi.org/api/ip";
const weatherApi =
  "http://api.openweathermap.org/data/2.5/weather?q="+process.env.CITY+",uk&units=metric&appid="+process.env.API_KEY;

var cacheTimeout = Date.now()
var sun = {
  sunrise: 0,
  sunset: 0,
}

client.on("connect", () => {
  console.log("Connected to MQTT Broker");
  client.subscribe("get/time");
  client.subscribe("get/sun");
  client.subscribe("healthCheck/broker");
});

client.on("error", (error) => {
  console.log("An error occured: " + error);
});
client.on("message", (topic) => {
  switch (topic) {
    case "get/time":
      console.log("Time Request!");
      getApiTime()
        .then((data) => {
          console.log(data);
          client.publish("spaff/time", JSON.stringify(data));
        })
        .catch((err) => {
          console.log(err);
        });
      break;
    case "get/sun":
      console.log("Sunrise Request!");
      getSun()
        .then((data) => {
          console.log(data);
          client.publish("spaff/sun", JSON.stringify(data));
        })
        .catch((err) => {
          console.log(err);
        });
      break;
  }
});
//Api Call
async function getApiTime() {
  const res = await axios.get(timeApi);
  console.log(res.data);
  const data = {
    time: Number(timeToDouble(res.data.datetime)),
    day: res.data.day_of_week - 1,  
  };
  return data;
}

async function getSun() {
  if(sun.sunrise !== 0 && (cacheTimeout) > Date.now()){
    const time = new Date(cacheTimeout)
    console.log("Will be fresh at: ", time.getHours(), ":", time.getMinutes(), ":", time.getSeconds())
    console.log("Sending cached sun data")
    return sun
  }
  const res = await axios.get(weatherApi);
  //console.log(res.data);
  sun = {
    sunrise: Number(timeConvert(res.data.sys.sunrise)),
    sunset: Number(timeConvert(res.data.sys.sunset)),
  };
  cacheTimeout = Date.now()  + 3600000
  return sun;
}

function timeToDouble(time){
    const timeStr = time.substring(11,19)
    const timeArray = timeStr.split(":")
    return timeArray[0] + "." + timeArray[1]
}

function timeConvert(time) {
  const unix_time = time;

  const date = new Date(unix_time * 1000);
  const hours = date.getHours();
  const minutes = "0" + date.getMinutes();

  const formattedTime =
    hours + "." + minutes.substr(-2)

  return formattedTime;
}
