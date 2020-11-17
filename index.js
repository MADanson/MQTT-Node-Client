const mqtt = require("mqtt");
const axios = require("axios");

const client = mqtt.connect("mqtt://192.168.1.104")

client.on("connect", () => {
    console.log("Connected to MQTT Broker")
    client.subscribe("getTime")
    client.subscribe("healthCheck/broker")
})

client.on("error", () => {
    console.log("An error occured!")
})
client.on("message", (topic, message) => {
    switch(topic){
        case("getTime"):
            //console.log("Time Request!")
            getTime().then((data)=> {
                //console.log(data)
                client.publish("timeSpaff", JSON.stringify(data))
            })
            break;
        case("healthCheck/broker"):
            //console.log("ALL SYSTEMS NOMINAL")
            client.publish("healthCheck/broker", "ALL SYSTEMS NOMINAL")
            break;
    }
})
//Api Call
async function getTime(){  
    const res = await axios.get("http://worldtimeapi.org/api/ip")
    const data = {
        time: res.data.datetime.substring(11,19),
        day: res.data.day_of_week,
        sunrise: "not available with this api",
        sunset: "not available with this api"
    }
    return data
}

