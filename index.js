const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

// --- 1. CONFIGURAR CLOUDINARY ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// --- 2. CONFIGURAR MULTER PARA SUBIR A LA NUBE ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'wejeee_productos', // Creará esta carpeta en tu Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  },
});
const upload = multer({ storage: storage });

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// --- RUTAS ---

// 1. Login de Admin
app.post('/api/login', async (req, res) => {
    const { password } = req.body;
    const admin = await prisma.admin.findFirst({ where: { username: 'admin' } });

    if (admin && admin.password === password) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }
});

// 2. Obtener Productos
app.get('/api/products', async (req, res) => {
    const products = await prisma.product.findMany({ orderBy: { id: 'desc' } });
    res.json(products);
});

// 3. Crear Producto (AHORA CON CLOUDINARY)
app.post('/api/products', upload.single('image'), async (req, res) => {
    try {
        const { name, price, category } = req.body;

        // req.file.path ahora contiene la URL oficial de Cloudinary en internet
        const imageUrl = req.file ? req.file.path : 'https://via.placeholder.com/300';

        const newProduct = await prisma.product.create({
            data: {
                name,
                price: Number(price),
                category,
                image: imageUrl
            }
        });
        res.json(newProduct);
    } catch (error) {
        console.error("Error subiendo producto:", error);
        res.status(500).json({ error: 'Error al crear producto' });
    }
});

// 4. Eliminar Producto
app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.product.delete({ where: { id: Number(id) } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error eliminando' });
    }
});

app.listen(port, () => {
    console.log(`🚀 Servidor listo en http://localhost:${port}`);
});
