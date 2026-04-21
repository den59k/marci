import { schema } from "compact-json-schema";
import { MarciApp } from ".";

const app = new MarciApp()

app.register(app => {
  app.addHook("onListen", (server) => {
    console.info("Server listened at " + server.url.toString())
  })
  const query = schema({ raw: "boolean" })
  app.get("/test/*", [{}, query], (req) => {
  
    console.log(req.server)
  
    return { status: "ok", query: req.query, params: req.params }
  })
})


app.listen(4000)