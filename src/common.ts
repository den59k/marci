import type { BunRequest } from "bun";
import type { SchemaItem, SchemaType } from "compact-json-schema";

export type RouteOptions = {
  params?: SchemaItem,
  body?: SchemaItem,
  query?: SchemaItem,
}

export interface MarciContext {
  
}

export type MarciRequest<R extends object = {}, T extends RouteOptions = {}> = MarciContext & R & {
  params: T["params"] extends object? SchemaType<T["params"]>: unknown
  query: T["body"] extends object? SchemaType<T["body"]>: unknown
  body: T["body"] extends object? SchemaType<T["body"]>: unknown
  raw: BunRequest
}

export type RouteAction <T extends RouteOptions, R extends object = {}> = (req: MarciRequest<R, T>) => (any | Promise<any>)

export type RegisterPluginOptions = { prefix?: string }