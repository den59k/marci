import type { BunRequest } from 'bun'
import { unfoldTypeBoxSchema, type SchemaItem } from 'compact-json-schema'
import { TypeBoxError } from '@sinclair/typebox'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import route from './route'
import { HTTPError } from './error'
import { MarciRequestInternal } from './request'
import type { MarciContext, MarciRequest, RegisterPluginOptions, RouteAction, RouteOptions } from './common'
import { getRouteOptions, isDefault, parseBody, type GetOptionsFromSchemaList, getValidationError, type PostOptionsFromSchemaList } from './utils'

export class MarciApp<R extends MarciContext = MarciContext> {

  private routes: Record<string, any> = {}
  private promises: Promise<void>[] = []
  private prefix = ""

  private onRequestHooks: Array<(ctx: MarciRequest<R>) => (void | Promise<void>)> = []

  private add(path: string, method: string, _options: RouteOptions | SchemaItem[], callback: RouteAction<any>) {
    let fullPath = (this.prefix + (path.endsWith("/")? path.slice(0, -1): path)) || "/"
    if (!(fullPath in this.routes)) {
      this.routes[fullPath] = {}
    }

    const options: RouteOptions = Array.isArray(_options)? getRouteOptions(method, _options): _options
    const paramsSchema = (options.params && !isDefault(options.params))? unfoldTypeBoxSchema(options.params): null
    const querySchema = options.query? unfoldTypeBoxSchema(options.query): null
    const bodyValidation = options.body? TypeCompiler.Compile(unfoldTypeBoxSchema(options.body)): null

    this.routes[fullPath][method] = async (req: BunRequest) => {

      const request = new MarciRequestInternal(req, paramsSchema, querySchema)

      for (const callback of this.onRequestHooks) {
        await callback(request as any)
      }

      const body = bodyValidation === null? undefined: await parseBody(bodyValidation, req)     
      request.body = body as any

      const resp = await callback(request as any)
      if (resp === undefined) {
        return new Response()
      } else if (resp instanceof Response) {
        return resp
      } else {
        return Response.json(resp)
      }
    }
  }

  addHook(where: "onRequest", callback: (ctx: MarciRequest<R>) => void) {
    if (where === "onRequest") {
      this.onRequestHooks.push(callback)
    }
  }

  get(path: string, callback: RouteAction<{}>): void
  get<T extends RouteOptions>(path: string, options: RouteOptions, callback: RouteAction<T, R>): void
  get<T extends readonly SchemaItem[]>(path: string, schemas: [...T], callback: RouteAction<GetOptionsFromSchemaList<T>, R>): void
  get(path: string, ...args: any[]): void {
    if (args.length === 1) {
      this.add(path, "GET", {}, args[0])
    } else {
      this.add(path, "GET", args[0], args[1])
    }
  }
  
  post(path: string, callback: RouteAction<{}>): void
  post<T extends RouteOptions>(path: string, options: RouteOptions, callback: RouteAction<T, R>): void
  post<T extends readonly SchemaItem[]>(path: string, schemas: [...T], callback: RouteAction<PostOptionsFromSchemaList<T>, R>): void
  post(path: string, ...args: any[]): void {
    if (args.length === 1) {
      this.add(path, "POST", {}, args[0])
    } else {
      this.add(path, "POST", args[0], args[1])
    }
  }

  put(path: string, callback: RouteAction<{}>): void
  put<T extends RouteOptions>(path: string, options: RouteOptions, callback: RouteAction<T, R>): void
  put<T extends readonly SchemaItem[]>(path: string, schemas: [...T], callback: RouteAction<PostOptionsFromSchemaList<T>, R>): void
  put(path: string, ...args: any[]): void {
    if (args.length === 1) {
      this.add(path, "PUT", {}, args[0])
    } else {
      this.add(path, "PUT", args[0], args[1])
    }
  }

  patch(path: string, callback: RouteAction<{}>): void
  patch<T extends RouteOptions>(path: string, options: RouteOptions, callback: RouteAction<T, R>): void
  patch<T extends readonly SchemaItem[]>(path: string, schemas: [...T], callback: RouteAction<PostOptionsFromSchemaList<T>, R>): void
  patch(path: string, ...args: any[]): void {
    if (args.length === 1) {
      this.add(path, "PATCH", {}, args[0])
    } else {
      this.add(path, "PATCH", args[0], args[1])
    }
  }

  delete(path: string, callback: RouteAction<{}>): void
  delete<T extends RouteOptions>(path: string, options: RouteOptions, callback: RouteAction<T, R>): void
  delete<T extends readonly SchemaItem[]>(path: string, schemas: [...T], callback: RouteAction<PostOptionsFromSchemaList<T>, R>): void
  delete(path: string, ...args: any[]): void {
    if (args.length === 1) {
      this.add(path, "DELETE", {}, args[0])
    } else {
      this.add(path, "DELETE", args[0], args[1])
    }
  }


  register(plugin: (app: MarciApp<any>) => void | Promise<void>, options: RegisterPluginOptions = {}) {
    const app = new MarciApp()

    app.routes = this.routes
    app.prefix = this.prefix + (options.prefix ?? "")

    const resp = plugin(app)
    if (typeof resp === "object") {
      this.promises.push(resp)
    }
  }

  async listen(port?: number) {
    if (this.promises.length > 0) {
      await Promise.all(this.promises)
    }
    Bun.serve({
      routes: this.routes,
      port,
      fetch(req) {
        const path = new URL(req.url).pathname
        return new Response(`Route ${path} not Found`, { status: 404 });
      },
      error(err) {
        if (err instanceof HTTPError) {
          return new Response(err.message, { status: err.statusCode })
        } else if (err instanceof TypeBoxError) {
          return new Response(
            getValidationError((err as any).error),
            { status: 400, headers: { "Content-Type": "application/json" } }
          )
        } 
      },
    })

    console.info(`Server listened on http://localhost:${port}`)
  }
}

const app = new MarciApp()
app.register(route, { prefix: "/api" })

app.listen(3000)