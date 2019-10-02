import {Message} from "discord.js"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permissions} from "./../../structures/Permissions"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class ChannelLink extends Command {
    constructor(kisaragi: Kisaragi) {
        super(kisaragi, {
            aliases: [],
            cooldown: 3
        })
    }

    public run = async (discord: Kisaragi, message: Message, args: string[]) => {
        const perms = new Permissions(discord, message)
        const embeds = new Embeds(discord, message)
        const sql = new SQLQuery(message)
        const star = discord.getEmoji("star")
        if (await perms.checkAdmin(message)) return
        const input = Functions.combineArgs(args, 1)
        if (input.trim()) {
            message.content = input.trim()
            linkPrompt(message)
            return
        }
        const linkText = await sql.fetchColumn("links", "text")
        const linkVoice = await sql.fetchColumn("links", "voice")
        const linkToggle = await sql.fetchColumn("links", "toggle")

        let linkDescription = ""
        if (linkText[0]) {
            for (let i = 0; i < linkText[0].length; i++) {
                linkDescription += `**${i + 1} => **\n` + `${star}_Text:_ <#${linkText[0][i]}>\n` +
                `${star}_Voice:_ **<#${linkVoice[0][i]}>**\n` +
                `${star}_State:_ **${linkToggle[0][i]}**\n`
            }
        } else {
            linkDescription = "None"
        }
        const linkEmbed = embeds.createEmbed()
        linkEmbed
        .setTitle(`**Linked Channels** ${discord.getEmoji("gabSip")}`)
        .setThumbnail(message.guild!.iconURL() as string)
        .setDescription(
            "Configure settings for linked channels. You can link a text channel to a voice channel so that only people in the voice channel can access it.\n" +
            "In order for this to work, you should disable the **read messages** permission on the text channel for all member roles.\n" +
            "\n" +
            "**Status** = Either on or off. In order for the status to be on, both the voice and text channel must be set.\n" +
            "\n" +
            "__Current Settings:__\n" +
            linkDescription + "\n" +
            "\n" +
            "__Edit Settings:__\n" +
            `${star}_**Mention a text channel** to set the text channel._\n` +
            `${star}_**Type the name of the voice channel** to set the voice channel._\n` +
            `${star}_Type **toggle (setting number)** to toggle the status._\n` +
            `${star}_Type **edit (setting number)** to edit a setting._\n` +
            `${star}_Type **delete (setting number)** to delete a setting._\n` +
            `${star}_Type **reset** to delete all settings._\n` +
            `${star}_Type **cancel** to exit._\n`
        )
        message.channel.send(linkEmbed)

        async function linkPrompt(msg: any) {
            let text = await sql.fetchColumn("links", "text")
            let voice = await sql.fetchColumn("links", "voice")
            let toggle = await sql.fetchColumn("links", "toggle")
            let [setText, setVoice, setInit] = [] as boolean[]
            if (!text[0]) text = [""]; setInit = true
            if (!voice[0]) voice = [""]; setInit = true
            if (!toggle[0]) toggle = [""]; setInit = true
            const responseEmbed = embeds.createEmbed()
            responseEmbed.setTitle(`**Linked Channels** ${discord.getEmoji("gabSip")}`)
            if (msg.content.toLowerCase() === "cancel") {
                responseEmbed
                .setDescription(`${star}Canceled the prompt!`)
                msg.channel.send(responseEmbed)
                return
            }
            if (msg.content.toLowerCase() === "reset") {
                await sql.updateColumn("links", "voice", null)
                await sql.updateColumn("links", "text", null)
                await sql.updateColumn("links", "toggle", "off")
                responseEmbed
                .setDescription(`${star}All settings were reset!`)
                msg.channel.send(responseEmbed)
                return
            }
            if (msg.content.toLowerCase().includes("delete")) {
                const num = Number(msg.content.replace(/delete/gi, "").replace(/\s+/g, ""))
                if (num) {
                    if (text[0]) {
                        text[num - 1] = ""
                        voice[num - 1] = ""
                        toggle[num - 1] = ""
                        text = text.filter(Boolean)
                        voice = voice.filter(Boolean)
                        toggle = toggle.filter(Boolean)
                        await sql.updateColumn("links", "text", text)
                        await sql.updateColumn("links", "voice", voice)
                        await sql.updateColumn("links", "toggle", toggle)
                        responseEmbed
                        .setDescription(`${star}Setting ${num} was deleted!`)
                        msg.channel.send(responseEmbed)
                        return
                    }
                } else {
                    responseEmbed
                    .setDescription(`${star}Setting not found!`)
                    msg.channel.send(responseEmbed)
                    return
                }
            }

            const newText = msg.content.match(/<#\d+>/g)
            const newVoice = msg.content.replace(/<#\d+>/g, "").match(/\D+/gi)
            if (newText) setText = true
            if (newVoice) setVoice = true

            let description = ""

            if (setText) {
                text.push(newText[0].replace(/<#/g, "").replace(/>/g, ""))
                if (setInit) text = text.filter(Boolean)
                await sql.updateColumn("links", "text", text)
                description += `${star}Text channel set to **${newText[0]}**!\n`
            }

            if (setVoice) {
                const channels = msg.guild.channels.filter((c: any) => {
                    if (c.type === "voice") return c
                })
                const channel = channels.find((c: any) => {
                    if (c.name.replace(/\s+/g, " ").toLowerCase().includes(newVoice[0].toLowerCase())) return c
                })
                if (channel) {
                    voice.push(channel.id)
                    if (setInit) voice = voice.filter(Boolean)
                    await sql.updateColumn("links", "voice", voice)
                    description += `${star}Voice channel set to **${channel.name}**!\n`
                } else {
                    return msg.channel.send(responseEmbed.setDescription("Voice channel not found!"))
                }
            }

            if (setText && setVoice) {
                toggle.push("on")
                if (setInit) toggle = toggle.filter(Boolean)
                await sql.updateColumn("links", "toggle", toggle)
                description += `${star}Status set to **on**!\n`
            } else {
                toggle.push("off")
                if (setInit) toggle = toggle.filter(Boolean)
                await sql.updateColumn("links", "toggle", toggle)
                description += `${star}Status set to **off**!\n`
            }

            responseEmbed
            .setDescription(description)
            msg.channel.send(responseEmbed)
            return
        }

        embeds.createPrompt(linkPrompt)
    }
}
