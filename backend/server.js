import 'dotenv/config'
import express from 'express'
import connectDB from './database/db.js'
import userRoute from './routes/userRoute.js'

const app = express()
const PORT = process.env.PORT || 3000

//middleware
app.use(express.json())

app.use('/api/v1/user', userRoute)

app.listen(PORT, () => {
  connectDB()
  console.log(`Server started at http://localhost:${PORT}`)
})


