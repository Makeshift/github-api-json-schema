import SwaggerParser from '@apidevtools/swagger-parser'
import { openapiSchemaToJsonSchema } from '@openapi-contrib/openapi-schema-to-json-schema'
import { OpenAPIV3 } from 'openapi-types'
import { Octokit } from 'octokit'
import migrate from 'json-schema-migrate'
import JsonRefParser from '@apidevtools/json-schema-ref-parser'

const octokit = new Octokit()
const files = await octokit.rest.repos.getContent({
  owner: 'github',
  repo: 'rest-api-description',
  path: 'descriptions/api.github.com/'
})

if (!Array.isArray(files.data)) throw new Error('Expected directory listing')
  
const versions = files.data.filter(file => file.name.startsWith('api.github.com.') && file.name.endsWith('.json'))

for (const version of versions) {
  let versionName = version.name.replace('api.github.com.', '')
  if (versionName === 'json') {
    versionName = 'latest'
  } else {
    versionName = versionName.replace('.json', '')
  }
  
  console.log(`Processing version ${version.name} as ${versionName}`)
  
  const parser = new SwaggerParser()
  const api = await parser.dereference(version.download_url!) 

  const waits = []
  const namespaces = new Set<string>()

  for (const [path, pathItem] of Object.entries(api.paths ?? {})) {
    if (!pathItem) {
      continue
    }

    const operationsByMethod = pathItem as Partial<Record<OpenAPIV3.HttpMethods, OpenAPIV3.OperationObject>>

    for (const method of Object.values(OpenAPIV3.HttpMethods)) {
      const operation = operationsByMethod[method]
      if (!operation) {
        continue
      }

      if (!operation.operationId) {
        throw new Error(`operationId is required for ${method} ${path}`)
      }

      const requestBody = operation.requestBody
      if (!requestBody || '$ref' in requestBody) {
        continue
      }

      const namespace = operation.operationId.split('/')[0]!
      if (!namespaces.has(namespace)) {
        namespaces.add(namespace)
        console.log(`Processing namespace ${namespace} in ${versionName}`)
      }
      
      const requestType = requestBody.content['application/json']?.schema
      if (requestType) {
        const asJsonSchema = openapiSchemaToJsonSchema(requestType)
        // This mutates the schema in-place
        migrate.draft2020(asJsonSchema)
        waits.push(Bun.write(`./schemas/${versionName}/${operation.operationId}.json`, JSON.stringify(asJsonSchema, null, 2)))
      }
    }
  }

  await Promise.all(waits)
}

// Deref the repository settings schema
const settingsSchema = await JsonRefParser.dereference('./repository-settings.schema.yaml')
await Bun.write('./schemas/repository-settings.json', JSON.stringify(settingsSchema, null, 2))
