const mqtt = require("mqtt");
const axios = require("axios");
const temp = require("pi-temperature")

//MQTT Connection
const client = mqtt.connect("mqtt://192.168.1.104")

client.on("connect", () => {
    console.log("Connected to MQTT Broker")
    client.subscribe("getTime")
    client.subscribe("healthCheck/broker")
})

client.on("error", (error) => {
    console.log("An error occured: "+error)
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
            var temp = temp.measure((err, temp) => {
                if(err) console.error(err)
                else return temp
            })
            client.publish("healthCheck/broker", `Power: ON, Temp: ${temp}`)
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

