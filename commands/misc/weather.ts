import {Message} from "discord.js"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Weather extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Posts the current weather in a city or zip code.",
            help:
            `
            \`weather city/zip code\` - Gets the weather
            `,
            examples:
            `
            \`=>weather new york\`
            `,
            aliases: ["forecast", "climate"],
            cooldown: 5
        })
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)

        const weather = require("openweather-apis")
        weather.setLang("en")
        weather.setUnits("imperial")
        weather.setAPPID(process.env.WEATHER_API_KEY)

        const city = Functions.combineArgs(args, 1)?.trim()
        if (!city) return message.reply(`What city do you want to search for ${discord.getEmoji("kannaCurious")}`)
        weather.setCity(city)

        let w: any
        await new Promise((resolve) => {
            weather.getAllWeather(function(err: Error, json: any) {
                w = json
                resolve()
            })
        }) as any

        if (!w) {
            return this.invalidQuery(embeds.createEmbed()
            .setAuthor("weather",  "https://cdn1.iconfinder.com/data/icons/weather-429/64/weather_icons_color-06-512.png")
            .setTitle(`**Weather** ${discord.getEmoji("AquaWut")}`))
        }

        const weatherEmbed = embeds.createEmbed()
        weatherEmbed
        .setAuthor("weather",  "https://cdn1.iconfinder.com/data/icons/weather-429/64/weather_icons_color-06-512.png")
        .setTitle(`**Weather** ${discord.getEmoji("AquaWut")}`)
        .setURL(`https://openweathermap.org/city/${w.id}`)
        .setThumbnail(`https://openweathermap.org/img/w/${w.weather[0].icon}.png`)
        .setDescription(
            `🌎_City:_ **${w.name}, ${w.sys.country}**\n` +
            `🌩️_Weather:_ **${w.weather?.[0]?.main ?? "Not found"}**\n` +
            `📏_Latitude/Longitude:_ \`${w.coord.lat}°, ${w.coord.lon}°\`\n` +
            `🌡️_Temperature:_ \`${w.main.temp}°F\`\n` +
            `🍧_Feels Like:_ \`${w.main.feels_like}°F\`\n` +
            `☀️_Minimum/Maximum:_ \`${w.main.temp_min}°F, ${w.main.temp_max}°F\`\n` +
            `☁️_Pressure:_ \`${w.main.pressure}hPa\`\n` +
            `❄️_Humidity:_ \`${w.main.humidity}%\`\n` +
            `💨_Wind Speed/Direction:_ \`${w.wind.speed}m/s, ${w.wind.deg}°\`\n`
        )
        message.channel.send(weatherEmbed)
        return
    }
}
