import * as ecs from '@aws-sdk/client-ecs'
import chalk from 'chalk'
import { Inquiry } from '../inquiry'
import { Command } from './command'
import { spawn, execSync } from 'child_process'
import { ecsClient } from '../dal'

export class ShellCommand extends Command {
  async exec(inquiry: Inquiry) {
    if (!this.checkSessionManager()) {
      return
    }

    const execResult = await ecsClient.send(
      new ecs.ExecuteCommandCommand({
        cluster: inquiry.cluster.clusterArn,
        task: inquiry.task?.taskArn,
        container: inquiry.container?.name,
        command: 'sh',
        interactive: true,
      })
    )

    const endPoint = await ecsClient.config.endpoint()

    spawn(
      'session-manager-plugin',
      [
        JSON.stringify(execResult.session),
        await ecsClient.config.region(),
        'StartSession',
        process.env['AWS_PROFILE'] ?? '',
        JSON.stringify({
          Target: inquiry.task?.containers?.find(
            (t) => t.name === inquiry.container?.name
          )?.runtimeId,
        }),
        `${endPoint.protocol}://${endPoint.hostname}`,
      ],
      {
        stdio: 'inherit',
      }
    )
  }

  checkSessionManager() {
    try {
      execSync('session-manager-plugin --version')
      return true
    } catch (error) {
      console.error(chalk.red('session-manager-plugin2 is not installed'))
      console.error(`Check this page for installation: ${chalk.blue('https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html')}`)
      return false
    }
  }

  requireTask = true
}
