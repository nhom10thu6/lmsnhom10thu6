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

/* =========================
   GET USERS
========================= */

app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.test.findMany()

    res.json(users)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

/* =========================
   ADD USER
========================= */

app.post('/api/users', async (req, res) => {
  try {

    const { id, name, email, phone } = req.body

    if (!name || !email) {
      return res.status(400).json({
        error: "Name và Email bắt buộc"
      })
    }

    const newUser = await prisma.test.create({
      data: {
        id: Number(id),
        name,
        email,
        phone: phone ? Number(phone) : null
      }
    })

    res.status(201).json(newUser)

  } catch (err) {

    console.error(err)

    // lỗi id trùng
    if (err.code === "P2002") {
      return res.status(400).json({
        error: "ID đã tồn tại"
      })
    }

    res.status(500).json({
      error: "Server error"
    })
  }
})

/* =========================
   SERVER START
========================= */

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})