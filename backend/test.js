const express = require('express')
const cors = require('cors')
const { PrismaClient } = require('./generated/prisma')

const app = express()
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())

// API lấy dữ liệu
app.get('/api/test', async (req, res) => {
  try {
    const data = await prisma.test.findMany()
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000')
})