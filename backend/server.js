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

app.get('/api/users', async (req, res) => {
    try {
        const data = await prisma.test.findMany()
        res.json(data)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error' })
    }
})

app.get('/api/findUser', async (req, res) => {
    try {
        const { id } = req.query
        const user = await prisma.test.findUnique({
            where: { id: parseInt(id) }
        })
        if (user) {
            res.json(user)
        } else {
            res.status(404).json({ error: 'User not found' })
        }
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error' })
    }
})

app.put('/api/test/:id', async (req, res) => {
    const { id } = req.params;
    let { name, email, phone } = req.body; 

    try {
        
        if (phone) phone = Number(phone);

        const result = await prisma.test.update({
            where: {
                id: Number(id)
            },
            data: {
                name: name,
                email: email,
                phone: phone
            }
        });

        res.json({
            message: 'Cập nhật thành công! ✅',
            data: result
        });
    } catch (err) {
        console.error("Lỗi Prisma:", err.meta?.cause || err.message);
        res.status(400).json({ 
            error: 'Không thể cập nhật. Kiểm tra xem ID có tồn tại không hoặc dữ liệu phone có phải là số không.' 
        });
    }
});


const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
