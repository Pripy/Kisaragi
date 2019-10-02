import {Message} from "discord.js"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permissions} from "./../../structures/Permissions"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Reboot extends Command {
    constructor(kisaragi: Kisaragi) {
        super(kisaragi, {
            aliases: [],
            cooldown: 3
        })
    }

    public unloadCommand: any = async (commandName: string) => {

      const mod: any = require.cache[require.resolve(`../commands/$${commandName}`)]
      delete require.cache[require.resolve(`../commands/${commandName}.js`)]
      for (let i = 0; i < mod.parent.children.length; i++) {
        if (mod.parent.children[i] === mod) {
          mod.parent.children.splice(i, 1)
          break
        }
      }
      return false
    }

    public run = async (discord: Kisaragi, message: Message, args: string[]) => {
      const perms = new Permissions(discord, message)
      const embeds = new Embeds(discord, message)
      const sql = new SQLQuery(message)
      const commands = await sql.fetchColumn("commands", "command")
      if (perms.checkBotDev(message)) return

      const rebootEmbed: any = embeds.createEmbed()

      await message.channel.send(rebootEmbed
          .setDescription("Bot is shutting down."))

      await Promise.all(commands.map((cmd: any) =>
            this.unloadCommand(cmd)
          ))
      process.exit(0)
      }
    }
