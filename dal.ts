import * as cwl from '@aws-sdk/client-cloudwatch-logs'
import * as ecs from '@aws-sdk/client-ecs'
import { fromIni } from '@aws-sdk/credential-providers'

type AsyncList<T> = AsyncGenerator<T, void, unknown>
export const ecsClient = new ecs.ECSClient({ credentials: fromIni() })
export const cwlClient = new cwl.CloudWatchLogsClient({
  credentials: fromIni(),
})

export async function loadAllClusters(): Promise<ecs.Cluster[]> {
  const paginator = ecs.paginateListClusters({ client: ecsClient }, {})
  const res: ecs.Cluster[] = []
  for await (const page of paginator) {
    const descriptions = await ecsClient.send(
      new ecs.DescribeClustersCommand({
        clusters: page.clusterArns,
      })
    )
    res.push(...(descriptions.clusters ?? []))
  }
  return res
}

export async function loadAllServices(cluster: string): Promise<ecs.Service[]> {
  const pages = ecs.paginateListServices({ client: ecsClient }, { cluster })
  const res: ecs.Service[] = []
  for await (const page of pages) {
    const description = await ecsClient.send(
      new ecs.DescribeServicesCommand({
        cluster,
        services: page.serviceArns,
      })
    )
    res.push(...(description.services ?? []))
  }

  return res
}

export async function loadAllTasks(service: ecs.Service): Promise<ecs.Task[]> {
  const pages = ecs.paginateListTasks(
    { client: ecsClient },
    {
      cluster: service.clusterArn,
      serviceName: service.serviceName,
    }
  )

  const res: ecs.Task[] = []
  for await (const page of pages) {
    const description = await ecsClient.send(
      new ecs.DescribeTasksCommand({
        cluster: service.clusterArn,
        tasks: page.taskArns,
      })
    )
    res.push(...(description.tasks ?? []))
  }

  return res
}

export async function listContainers(
  task: ecs.Task
): Promise<ecs.ContainerDefinition[]> {
  const res = await ecsClient.send(
    new ecs.DescribeTaskDefinitionCommand({
      taskDefinition: task.taskDefinitionArn,
    })
  )

  return res.taskDefinition?.containerDefinitions ?? []
}

export async function* streamEvents(
  logGroup: string
): AsyncGenerator<cwl.FilteredLogEvent, void, void> {
  async function* generator(
    logGroup: string,
    since: number,
    lastSeenEvents: string[]
  ): AsyncGenerator<cwl.FilteredLogEvent, void, void> {
    const paginator = cwl.paginateFilterLogEvents(
      { client: cwlClient },
      {
        logGroupName: logGroup,
        startTime: since,
      }
    )
    let newSince = since
    const seenIds: string[] = []
    for await (const page of paginator) {
      for (const event of page.events ?? []) {
        if (lastSeenEvents.includes(event.eventId!)) {
          continue
        }
        newSince = Math.max(newSince, event.timestamp!)
        seenIds.push(event.eventId!)
        yield event
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
      yield* generator(
        logGroup,
        newSince,
        seenIds.length ? seenIds : lastSeenEvents
      )
    }
  }

  yield* generator(logGroup, new Date().getTime() - 60000, [])
}
