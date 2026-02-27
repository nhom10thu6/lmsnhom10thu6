require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { PrismaClient } = require('./generated/prisma')

const app = express()
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())

// test server
app.get('/', (req, res) => {
    res.json({ message: 'API is running 🚀' })
})

// ✅ API lấy dữ liệu bảng test
app.get('/api/test', async (req, res) => {
    try {
        const data = await prisma.test.findMany()
        res.json(data)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error' })
    }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
