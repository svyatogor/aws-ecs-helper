import chalk from 'chalk'
import { streamEvents } from '../dal'
import { Inquiry } from '../inquiry'
import { Command } from './command'

export class TailCommand extends Command {
  async exec(inquiry: Inquiry) {
    const logGroup =
      inquiry.container?.logConfiguration?.options?.['awslogs-group']
    if (!logGroup) {
      console.log(
        chalk.redBright(
          `❌ ${inquiry.container?.name} does not have a log group configured`
        )
      )
      return
    }
    for await (const event of streamEvents(logGroup)) {
      console.log(event.message)
    }
  }

  requireTask = true
}
