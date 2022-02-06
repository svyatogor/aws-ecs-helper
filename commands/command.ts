import { Inquiry } from '../inquiry'
export type CommandType = 'shell' | 'restart' | 'tail'

export abstract class Command {
  abstract exec(inquiry: Inquiry): Promise<void>

  requireTask: boolean = false
  requireConfirmation: boolean = false
}

