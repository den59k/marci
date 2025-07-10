import { schema } from "compact-json-schema";
import { MarciApp } from ".";

const app = new MarciApp()

const query = schema({ raw: "boolean" })
app.get("/test", [{}, query], (req) => {
  

  return { status: "ok", query: req.query, params: req.params }
})

app.listen(4000).then(server => console.info("Server listened at " + server.url.toString()))