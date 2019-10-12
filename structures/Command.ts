interface CommandOptions {
  name: string
  category: string
  description: string
  help: string
  examples: string
  image: string
  enabled: boolean
  guildOnly: boolean
  aliases: string[]
  cooldown: number
  permission: string
  botPermission: string
}

export class Command {

  public readonly options: CommandOptions

  constructor({
      name = "None",
      category = "Misc",
      description = "No description provided.",
      help = "This command is not documented.",
      examples = "There are no examples.",
      image = "No image",
      enabled = true,
      guildOnly = false,
      aliases = [""],
      cooldown = 3,
      permission = "SEND_MESSAGES",
      botPermission = "SEND_MESSAGES"
    }) {
      this.options = {name, category, description, help, examples, image, enabled, guildOnly, aliases, cooldown, permission, botPermission}
    }

  get help() {
      return this.options
  }

}