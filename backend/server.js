import 'dotenv/config'
import express from 'express'
import connectDB from './database/db.js'
import userRoute from './routes/userRoute.js'
import cors from "cors";

const app = express()
const PORT = process.env.PORT || 3000

//middleware
app.use(express.json())
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use('/api/v1/user', userRoute)

app.listen(PORT, () => {
  connectDB()
  console.log(`Server started at http://localhost:${PORT}`)
})


