const express = require('express');
const fs = require('fs').promises;
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Sirve archivos estáticos como index.html

const CSV_FILE = path.join(__dirname, 'movimientos_maestro.csv');

// Leer transacciones
app.get('/transacciones', async (req, res) => {
    try {
        const data = await fs.readFile(CSV_FILE, 'utf-8');
        const lines = data.trim().split('\n').filter(line => line.trim());
        const transacciones = lines.map(line => {
            const [type, amount, date] = line.split(',');
            return { type, amount: parseFloat(amount), date };
        });
        res.json(transacciones);
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.json([]);
        } else {
            res.status(500).json({ error: 'Error al leer el historial.' });
        }
    }
});

// Añadir transacción
app.post('/transacciones', async (req, res) => {
    const { type, amount, date } = req.body;
    if (!type || !amount || !date || (type !== 'gasto' && type !== 'pago') || amount <= 0) {
        return res.status(400).json({ error: 'Datos inválidos.' });
    }
    const row = `${type},${amount.toFixed(2)},${date}\n`;
    try {
        await fs.appendFile(CSV_FILE, row);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error al guardar la transacción.' });
    }
});

// Descargar CSV
app.get('/descargar-csv', async (req, res) => {
    try {
        const data = await fs.readFile(CSV_FILE, 'utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=movimientos_maestro.csv');
        res.setHeader('Content-Type', 'text/csv');
        res.send(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.send('');
        } else {
            res.status(500).json({ error: 'Error al descargar el CSV.' });
        }
    }
});

app.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'));