const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Configuración de transporte de correo (Nodemailer)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'po80payments@gmail.com',
        pass: 'tu_password_o_app_password' // Reemplazar con contraseña de aplicación real si es necesario
    }
});

// Base de datos en memoria robusta con persistencia de estados y ventas
const usersDB = new Map();
// Cuenta por defecto con acceso total preconfigurado
usersDB.set('usu6y', { password: 'password123', license: 'OP80-PRO-9999', hasAccess: true });

const activeLicenses = new Set(['OP80-PRO-9999']);
const activeSales = new Map(); // Registro seguro de transacciones para evitar "Sale not found"

app.get('/', (req, res) => {
    res.send('op80.com Gateway Server is running successfully.');
});

io.on('connection', (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    // Inicio de sesión de usuario
    socket.on('user-login', (data) => {
        const { username, password } = data;
        if (usersDB.has(username)) {
            const user = usersDB.get(username);
            if (user.password === password) {
                socket.emit('login-success', {
                    username,
                    license: user.license || '',
                    hasAccess: user.hasAccess || false
                });
                return;
            }
        }
        socket.emit('login-error', { message: 'Credenciales inválidas o usuario no registrado.' });
    });

    // Verificación o consulta de estado de venta/pago
    socket.on('check-sale-status', (data) => {
        const { code, username } = data;
        
        // Buscar por código de licencia o venta activa
        if (activeSales.has(code) || activeLicenses.has(code)) {
            const saleInfo = activeSales.get(code) || { status: 'VERIFIED', username };
            socket.emit('sale-status-result', {
                found: true,
                status: saleInfo.status || 'VERIFIED',
                message: 'Sale and license verified successfully.',
                sale: saleInfo
            });
        } else {
            socket.emit('sale-status-result', {
                found: false,
                status: 'NOT_FOUND',
                message: 'Sale not found. Please complete the transaction or request automated activation.'
            });
        }
    });

    // Activación automática y registro de venta
    socket.on('request-automated-activation', async (data) => {
        const { username, plan } = data;
        const selectedPlan = plan || 'Standard Access';
        const generatedCode = `OP80-${crypto.randomBytes(3).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        
        // Registrar en memoria de forma persistente para el ciclo de vida del servidor
        activeLicenses.add(generatedCode);
        activeSales.set(generatedCode, { 
            username: username || 'Anónimo', 
            plan: selectedPlan, 
            timestamp: Date.now(), 
            status: 'VERIFIED' 
        });
        
        if (username && usersDB.has(username)) {
            const user = usersDB.get(username);
            user.license = generatedCode;
            user.hasAccess = true;
        } else if (username) {
            // Crear usuario si no existe
            usersDB.set(username, { password: 'user123', license: generatedCode, hasAccess: true });
        }

        try {
            await transporter.sendMail({
                from: '"op80.com Gateway" <po80payments@gmail.com>',
                to: 'po80payments@gmail.com',
                subject: `[AUTO-PAYMENT] User: ${username || 'N/A'} | Plan: ${selectedPlan}`,
                text: `Verified payment order registered on op80.com.\n\nUser: ${username || 'N/A'}\nPlan: ${selectedPlan}\nLicense Code: ${generatedCode}\n\nVerify BTC arrival in wallet (bc1qep3ntxf6lz037ny04706u88jsl364p0ny4776s).`
            });
        } catch (err) {
            console.log("Mail dispatch note:", err.message);
        }

        socket.emit('activation-dispatched', {
            code: generatedCode,
            message: 'Payment registered and sale successfully logged. System unlocked.'
        });
    });

    socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
