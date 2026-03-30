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
    folder: 'wejeee_productos',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  },
});
// CAMBIO IMPORTANTE: Ahora aceptamos un array de imágenes llamado 'images' (máximo 4)
const upload = multer({ storage: storage });

// MIDDLEWARE
app.use(cors({
  origin: [
    'https://wejeee.com',
    'https://www.wejeee.com',
    'https://wejee-frontend.vercel.app',
    'http://localhost:5173' // Para tus pruebas locales
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
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

// 3. Crear Producto (AHORA CON HASTA 4 IMÁGENES Y MÁS DETALLES)
// Usamos upload.array('images', 4) para permitir múltiples fotos
app.post('/api/products', upload.array('images', 4), async (req, res) => {
    try {
        const { name, price, category, description, gender, sizes } = req.body;

        // Extraer URLs de las imágenes subidas a Cloudinary
        const imageUrls = req.files ? req.files.map(file => file.path) : [];

        // Asignamos las imágenes en orden. Si no suben la 2, 3 o 4, quedan en null.
        const image1 = imageUrls[0] || 'https://via.placeholder.com/300';
        const image2 = imageUrls[1] || null;
        const image3 = imageUrls[2] || null;
        const image4 = imageUrls[3] || null;

        const newProduct = await prisma.product.create({
            data: {
                name,
                price: Number(price),
                category,
                image: image1,
                image2: image2,
                image3: image3,
                image4: image4,
                description: description || null,
                gender: gender || null,
                sizes: sizes || null,
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