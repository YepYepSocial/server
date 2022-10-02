import express from "express"
import * as url from "url"
import { createClient } from "redis"
import dotenv from "dotenv"

const __dirname = url.fileURLToPath(new URL(".", import.meta.url))
dotenv.config({
  path: __dirname + "/.env"
})

const main = async () => {
  const client = createClient({
    url: process.env.REDIS_PORT
  })
  client.on("error", (err) => console.log("Redis Client Error", err))
  const app = express()

  await client.connect()

  app.use(express.json())

  app.post("/api/timetable", async (request, response) => {
    if (!(request.body.className && request.body.weekday && request.body.timetable)) {
      response.status(400).json("bad request")
      return
    }

    const { className, weekday, timetable } = request.body
    await client.set(className + weekday, JSON.stringify(timetable))

    response.status(200).json(timetable)
  })

  app.get("/api/timetable", async (request, response) => {
    if (!(request.body.className && request.body.weekday)) {
      response.status(400).json("bad request")
      return
    }

    const { className, weekday } = request.body
    const timetable = client.get(className + weekday)

    response.status(200).json(timetable)
  })

  app.listen(process.env.PORT, () => console.log(`I'm listening PORT ${process.env.PORT}`))
}

main()
