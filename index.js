const mqtt = require("mqtt");
const axios = require("axios");
const ip = require("ip");
const os = require("os");
require("dotenv").config();
const temp = require("pi-temperature");

//MQTT Connection
const client = mqtt.connect("mqtt://" + process.env.BROKER_IP, {
  username: "blinds",
  password: process.env.PASSKEY,
});
const timeApi = "http://worldtimeapi.org/api/ip";
const weatherApi =
  "http://api.openweathermap.org/data/2.5/weather?q=" +
  process.env.CITY +
  ",uk&units=metric&appid=" +
  process.env.API_KEY;

var cacheTimeout = Date.now();
var sun = {
  sunrise: 0,
  sunset: 0,
};

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
      time();
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
    case "healthCheck/broker":
      healthReport().then((data) => {
        console.log(data);
        client.publish("health/broker", JSON.stringify(data));
      });
      break;
  }
});

async function time() {
  var res = {};
  let maxAttempts = 0;
  var success = false;
  while (!success && maxAttempts < 5) {
    const attempt = await timeApiCall();
    if (attempt.status === 200) {
      res = attempt.data;
      success = true;
      break;
    }

    console.log("Failed... Retrying");
    setTimeout(() => {
      maxAttempts++;
    }, 2000);
  }
  if (success === false) {
    console.error("Time server timed out");
    return null;
  }
  // console.log(res);
  const data = {
    time: timeToDouble(res.datetime),
    day: res.day_of_week,
  };
  const seconds = res.datetime.substring(17, 19);
  console.log(seconds);
  const timeout = 60 - seconds;

  console.log(timeout, "Seconds till the minute");

  setTimeout(() => {
    console.log("Spaffed Time");
    client.publish("spaff/time", JSON.stringify(data));
  }, timeout * 1000);
}

async function timeApiCall() {
  const res = axios
    .get(timeApi)
    .then((res) => {
      return res;
    })
    .catch((err) => {
      return err;
    });
  return res;
}

async function getSun() {
  if (sun.sunrise !== 0 && cacheTimeout > Date.now()) {
    const time = new Date(cacheTimeout);
    console.log(
      "Will be fresh at: ",
      time.getHours(),
      ":",
      time.getMinutes(),
      ":",
      time.getSeconds()
    );
    console.log("Sending cached sun data");
    return sun;
  }
  const res = await axios.get(weatherApi);
  //console.log(res.data);
  sun = {
    sunrise: Number(timeConvert(res.data.sys.sunrise)),
    sunset: Number(timeConvert(res.data.sys.sunset)),
  };
  cacheTimeout = Date.now() + 3600000;
  return sun;
}

async function healthReport() {
  let report = {
    local_ip: ip.address(),
    device: os.hostname(),
    temp: getTemp(),
    uptime: os.uptime(),
  };
  return report;
}

function getTemp() {
  if (process.env.ISDEV === true) return "Script is in development mode";
  const temp = temp.measure((err, temp) => {
    if (err) console.error(err);
    else return temp;
  });
  return temp;
}

function timeToDouble(time) {
  const timeStr = time.substring(11, 19);
  const timeArray = timeStr.split(":");
  if (timeArray[1] === 59) {
    timeArray[1] = 0;
    if (timeArray[0] === 23) {
      timeArray[0] = 0;
    }
  }
  return timeArray[0] + "." + timeArray[1];
}

function timeConvert(time) {
  const unix_time = time;

  const date = new Date(unix_time * 1000);
  const hours = date.getHours();
  const minutes = "0" + date.getMinutes();

  const formattedTime = hours + "." + minutes.substr(-2);

  return formattedTime;
}
