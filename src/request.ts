import { Value } from "@sinclair/typebox/value"
import type { BunRequest } from "bun"
import type { SchemaType } from "compact-json-schema"
import type { RouteOptions } from "./common"

export class MarciRequestInternal<T extends RouteOptions = {}> {

  raw: BunRequest
  params: T["params"] extends object? SchemaType<T["params"]>: unknown
  query: T["body"] extends object? SchemaType<T["body"]>: unknown
  body: T["body"] extends object? SchemaType<T["body"]>: unknown = null as any

  constructor(req: BunRequest, paramsSchema: any, querySchema: any) {
    this.params = paramsSchema === null? req.params: Value.Parse(paramsSchema, req.params) as any
    
    if (req.url.includes("?")) {
      const params = new URL(req.url).searchParams
      this.query = querySchema === null? params: Value.Parse(querySchema, params) as any
    } else {
      this.query = null as any
    }

    this.raw = req
  }
}