import { CommandType } from './commands/command'
import * as ecs from '@aws-sdk/client-ecs'

export type Inquiry = {
  cluster: ecs.Cluster
  service: ecs.Service
  command: CommandType
  task?: ecs.Task
  container?: ecs.ContainerDefinition
  confirm?: boolean
}
