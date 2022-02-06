import fuzzy from 'fuzzy'
import { createSpinner } from 'nanospinner'
import { Inquiry } from './inquiry'

interface ListItem<T> {
  name: string
  short: string
  value: T
}

export function mapToListItem<T>(prop: keyof T): (e: T) => ListItem<T> {
  return function (e: T) {
    return {
      name: String(e[prop]),
      value: e,
      short: String(e[prop]),
    }
  }
}

export async function withSpinner<T>(
  fn: () => Promise<T>,
  message: string
): Promise<T> {
  const spinner = createSpinner(message).start()
  const res = await fn()
  spinner.stop()
  process.stdout.moveCursor(0, -1)
  return res
}

export function listSearch(this: any, _: Partial<Inquiry>, input: string) {
  if (!input && this.choices.realChoices.length === 1) {
    // autoselect if list only has one option
    setTimeout(() => {
      process.stdin.emit('keypress', '\r')
    }, 200)
    return this.choices.realChoices
  }
  return !input
    ? this.choices.realChoices
    : fuzzy
        .filter(input, this.choices.realChoices, {
          extract: (e) => (e as any).name,
        })
        .map((e) => e.original)
}
