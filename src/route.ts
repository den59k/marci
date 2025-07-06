import { schema } from "compact-json-schema"
import type { MarciApp } from "."
import type { MarciRequest } from "./common"

export const useAuth = (req: MarciRequest<{ user: string }>): void => {
  req.user = "test"
}

export default (app: MarciApp<{ user: string }>): void => {

  const userParams = schema({ userId: "number" })
  const createNewUser = schema({ name: { type: "string" } })

  app.addHook("onRequest", useAuth)

  app.get("/", () => {
    return { status: "up" }
  })

  app.get("/users", () => {
    return []
  })

  app.get("/users/:userId", [userParams], async (req) => {
    return { id: req.params.userId }
  })

  app.post("/users/:userId", [userParams, createNewUser], async (req) => {
    
    console.log(req.user)

    return { id: req.params.userId, name: req.body.name }
  })
}