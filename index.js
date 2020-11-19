const mqtt = require("mqtt");
const axios = require("axios");
//const temp = require("pi-temperature");

//MQTT Connection
const client = mqtt.connect("mqtt://192.168.1.104");
const timeApi = "http://worldtimeapi.org/api/ip";
const weatherApi =
  "http://api.openweathermap.org/data/2.5/weather?q=Bristol,uk&units=metric&appid=b9c11ca10cec7e4ad57869a653171aee";

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
      getTime()
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
async function getTime() {
  const res = await axios.get(timeApi);
  console.log(res.data);
  const data = {
    time: timeToDouble(res.data.datetime),
    day: res.data.day_of_week,
  };
  return data;
}
async function getSun() {
  const res = await axios.get(weatherApi);
  //console.log(res.data);
  const data = {
    sunrise: timeConvert(res.data.sys.sunrise),
    sunset: timeConvert(res.data.sys.sunset),
  };
  return data;
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
