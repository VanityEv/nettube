import express from "express"
import cors from 'cors'
import config from "./config/config.js"

const app = express()
const port = config.server.port

app.use(cors())

app.get("/", (req, res) => {
    res.json({message: "Static site rendering"});
});

app.listen(port, ()=>{
    console.log( `Server running on port ${port}`)
})