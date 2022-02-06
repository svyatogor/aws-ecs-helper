import { Command, CommandType } from './command'
import { RestartCommand } from './restart'
import { ShellCommand } from './shell'
import { TailCommand } from './tails'

const commands: { [key in CommandType]: Command } = {
  shell: new ShellCommand(),
  restart: new RestartCommand(),
  tail: new TailCommand(),
}

export default commands
