import axios from "axios"
import Booru from "booru"
import {Message} from "discord.js"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "./../../structures/Permission"

export default class Gelbooru extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Search for anime images on gelbooru.",
            help:
            `
            _Note: Underscores are not required._
            \`gelbooru\` - Get a random image.
            \`gelbooru link/id\` - Gets the image from the link.
            \`gelbooru tag\` - Gets an image with the tag.
            \`gelbooru r18\` - Get a random r18 image.
            \`gelbooru r18 tag\` - Get an r18 image with the tag.
            `,
            examples:
            `
            \`=>gelbooru\`
            \`=>gelbooru tenma gabriel white\`
            \`=>gelbooru r18 gabriel dropout\`
            `,
            aliases: ["gel"],
            random: "none",
            cooldown: 20
        })
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const gelbooru = Booru("gelbooru", process.env.GELBOORU_API_KEY)
        const perms = new Permission(discord, message)
        const headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"}
        const gelbooruEmbed = embeds.createEmbed()
        .setAuthor("gelbooru", "https://pbs.twimg.com/profile_images/1118350008003301381/3gG6lQMl.png")
        .setTitle(`**Gelbooru Search** ${discord.getEmoji("gabLewd")}`)

        let tags
        if (!args[1]) {
            tags = ["1girl", "rating:safe"]
        } else if (args[1].toLowerCase() === "r18") {
            tags = Functions.combineArgs(args, 2).split(",")
            if (!tags.join("")) tags = ["1girl"]
            tags.push("-rating:safe")
        } else {
            tags = Functions.combineArgs(args, 1).split(",")
            tags.push("rating:safe")
        }

        const tagArray: string[] = []
        for (let i = 0; i < tags.length; i++) {
            tagArray.push(tags[i].trim().replace(/ /g, "_"))
        }

        let url
        if (tags.join("").match(/\d\d+/g)) {
            url = `https://gelbooru.com/index.php?page=post&s=view&json=1&id=${tags.join("").match(/\d\d+/g)}`
        } else {
            const image = await gelbooru.search(tagArray, {limit: 1, random: true})
            if (!image[0]) {
                return this.invalidQuery(gelbooruEmbed, "Underscores are not required, " +
                "if you want to search multiple terms separate them with a comma. Tags usually start with a last name; try looking up your tag " +
                "on the [**Gelbooru Website**](https://gelbooru.com//)")
            }
            url = gelbooru.postView(image[0].id)
        }

        let id
        if (url.match(/json/)) {
            id = url.match(/\d+/g)!.join("").slice(1)
        } else {
            id = url.match(/\d+/g)!.join("")
        }
        const result = await axios.get(`https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&id=${id}${process.env.GELBOORU_API_KEY}`, {headers}).then((r) => r.data)
        const img = result[0]
        if (!img) return this.invalidQuery(gelbooruEmbed, "The url is invalid.")
        if (img.rating !== "s") {
            if (!perms.checkNSFW()) return
        }
        gelbooruEmbed
        .setURL(url)
        .setDescription(
            `${discord.getEmoji("star")}_Source:_ ${img.source}\n` +
            `${discord.getEmoji("star")}_Uploader:_ **${img.owner}**\n` +
            `${discord.getEmoji("star")}_Creation Date:_ **${Functions.formatDate(img.created_at)}**\n` +
            `${discord.getEmoji("star")}_Tags:_ ${Functions.checkChar(String(img.tags), 1900, " ")}\n`
        )
        .setImage(img.file_url)
        // .setImage(`https://img2.gelbooru.com/samples/${img.directory}/sample_${img.image}`)
        message.channel.send(gelbooruEmbed)
    }
}