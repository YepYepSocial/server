import express from "express"
import * as url from "url"
import { createClient } from "redis"
import dotenv from "dotenv"
import { getGrades } from "./getGrades.js"
import cors from "cors"
import path from "path"

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
  app.use(cors({ origin: "*" }))

  app.post("/api/timetable", async (request, response) => {
    if (!((request.body.gradeId || request.body.gradeId === 0) &&
      (request.body.weekday || request.body.weekday === 0) && request.body.timetable)) {
      response.status(400).json("bad request")
      return
    }

    const { gradeId, weekday, timetable } = request.body
    await client.set(gradeId + weekday, JSON.stringify(timetable))

    response.status(200).json(timetable)
  })

  app.get("/api/timetable", async (request, response) => {
    if (!(request.query.gradeId && request.query.weekday)) {
      response.status(400).json("bad request")
      return
    }

    const { gradeId, weekday } = request.query
    const timetable = JSON.parse(await client.get(gradeId + weekday))

    response.status(200).json(timetable)
  })

  app.get("/api/grades", (request, response) => {
    response.status(200).json(getGrades())
  })

  app.get("/admin/*", (request, response) => {
    response.sendFile(path.resolve("../admin/build", "index.html"))
  })

  app.get("*", (request, response) => {
    response.sendFile(path.resolve("../client/build", "index.html"))
  })

  app.listen(process.env.PORT, () => console.log(`I'm listening PORT ${process.env.PORT}`))
}

main()
