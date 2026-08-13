import { OpenAPIHandler } from '@orpc/openapi/fetch'
import { OpenAPIReferencePlugin } from '@orpc/openapi/plugins'
import { SmartCoercionPlugin } from '@orpc/json-schema'
import { onError } from '@orpc/server'
import { RPCHandler } from '@orpc/server/fetch'
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4'
import router from './orpc/router/index.js'

export { default as router } from './orpc/router/index.js'

export const rpcHandler = new RPCHandler(router)
export const openApiHandler = new OpenAPIHandler(router, {
  interceptors: [
    onError((error) => {
      console.error(error)
    }),
  ],
  plugins: [
    new SmartCoercionPlugin({ schemaConverters: [new ZodToJsonSchemaConverter()] }),
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
      specGenerateOptions: {
        info: { title: 'OpenCMO API', version: '1.0.0' },
        commonSchemas: { UndefinedError: { error: 'UndefinedError' } },
      },
    }),
  ],
})
