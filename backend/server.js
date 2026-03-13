require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { PrismaClient } = require('./generated/prisma')
// const { PrismaClient } = require('@prisma/client')

const app = express()
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())

// test server
app.get('/', (req, res) => {
    res.json({ message: 'API is running 2 🚀' })
})

/* =======================
READ ALL
======================= */
app.get('/users', async (req, res) => {
    try {
        const data = await prisma.test.findMany()
        res.json(data)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error' })
    }
})

// /* =======================
// FIND USER BY ID
// ======================= */
// // app.get('/api/findUser', async (req, res) => {
// //     try {
// //         const { id } = req.query

// //         const user = await prisma.test.findUnique({
// //             where: { id: parseInt(id) }
// //         })

// //         if (!user) {
// //             return res.status(404).json({ error: 'User not found' })
// //         }

// //         res.json(user)

// //     } catch (err) {
// //         console.error(err)
// //         res.status(500).json({ error: 'Server error' })
// //     }
// // })
app.get('/users/:id', async (req, res) => {
  try {

    const { id } = req.params

    const user = await prisma.test.findUnique({
      where: { id: parseInt(id) }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(user)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// /* =======================
// CREATE USER
// ======================= */
app.post('/api/users', async (req, res) => {
  try {

    const { id, name, email, phone } = req.body

    const newUser = await prisma.test.create({
      data: {
        id: parseInt(id),
        name,
        email,
        phone: parseInt(phone)
      }
    })

    res.json(newUser)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// /* =======================
// UPDATE USER
// ======================= */
// app.put('/api/users/:id', async (req, res) => {
//   try {

//     const { id } = req.params
//     const { name, email, phone } = req.body

//     const updatedUser = await prisma.test.update({
//       where: { id: parseInt(id) },
//       data: {
//         name,
//         email,
//         phone: parseInt(phone)
//       }
//     })

//     res.json(updatedUser)

//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ error: 'Server error' })
//   }

// })


// /* =======================
// DELETE USER
// ======================= */
app.delete('/api/users/:id', async (req, res) => {
    try {

        const { id } = req.params

        await prisma.test.delete({
            where: { id: parseInt(id) }
        })

        res.json({ message: 'Deleted successfully' })

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error' })
    }
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})