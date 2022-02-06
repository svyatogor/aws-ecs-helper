import inquirer from 'inquirer'
import isl from 'inquirer-autocomplete-prompt'
import commands from './commands'
import { CommandType } from './commands/command'
import { listSearch, mapToListItem, withSpinner } from './helpers'
import { Inquiry } from './inquiry'
import dal = require('./dal')

inquirer.registerPrompt('search-list', isl)

const commandOptions: { name: string; value: CommandType; key: string }[] = [
  {
    name: 'Shell',
    value: 'shell',
    key: 's',
  },
  {
    name: 'Restart',
    value: 'restart',
    key: 'r',
  },
  {
    name: 'Tail logs',
    value: 'tail',
    key: 't',
  },
]

async function askQuestions() {
  const yesNoChoices = [
    { name: 'Yes', value: true, key: 'y' },
    { name: 'No', value: false, key: 'n' },
  ]

  const res: Inquiry = await inquirer.prompt([
    {
      type: 'search-list',
      name: 'cluster',
      message: 'Select cluster',
      choices: () =>
        withSpinner(
          async () =>
            (await dal.loadAllClusters()).map(mapToListItem('clusterName')),
          'Loading clusters...'
        ),
      source: listSearch,
    },
    {
      type: 'search-list',
      name: 'service',
      message: 'Select service',
      choices: async ({ cluster }) =>
        withSpinner(
          async () =>
            (
              await dal.loadAllServices(cluster.clusterArn!)
            ).map(mapToListItem('serviceName')),
          'Loading services...'
        ),
      source: listSearch,
    },
    {
      type: 'search-list',
      name: 'command',
      message: 'Action',
      choices: commandOptions,
      source: listSearch,
    },
    {
      type: 'search-list',
      name: 'task',
      message: 'Select task',
      when: ({ command }: Inquiry) => command === 'shell' || command === 'tail',
      choices: ({ service }) =>
        withSpinner(
          async () =>
            (await dal.loadAllTasks(service)).map(mapToListItem('taskArn')),
          'Listing tasks'
        ),
      source: listSearch,
    },
    {
      type: 'search-list',
      name: 'container',
      message: 'Select container',
      when: ({ command }: Inquiry) => commands[command].requireTask,
      choices: ({ task }) =>
        withSpinner(
          async () =>
            (await dal.listContainers(task!)).map(mapToListItem('name')),
          'Listing tasks'
        ),
      source: listSearch,
    },
    {
      type: 'expand',
      name: 'confirm',
      message: ({ service }: Inquiry) => `Restart ${service.serviceName}?`,
      when: ({ command }: Inquiry) => commands[command].requireConfirmation,
      choices: yesNoChoices,
    },
  ])
  return res
}

async function main() {
  try {
    const res = await askQuestions()
    if (res.confirm === false) {
      return
    }
    commands[res.command].exec(res)
  } catch (e) {
    console.error(e)
  }
}

main()
  .then(() => {
    console.log('Bye!')
  })
  .catch((e) => console.error(e))
