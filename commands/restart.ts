import { Inquiry } from '../inquiry'
import { Command } from './command'
import * as ecs from '@aws-sdk/client-ecs'
import chalk from 'chalk'
import { ecsClient } from '../dal'

export class RestartCommand extends Command {
  async exec(inquiry: Inquiry) {
    await ecsClient.send(
      new ecs.UpdateServiceCommand({
        cluster: inquiry.cluster.clusterArn,
        service: inquiry.service.serviceArn,
        forceNewDeployment: true,
      })
    )
    console.log(
      chalk.greenBright(`✔ Restarting ${inquiry.service.serviceName} now...`)
    )
  }

  requireConfirmation = true
}
