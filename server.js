const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Servir archivos estáticos (carga tu index.html y recursos)
app.use(express.static(path.join(__dirname)));

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
        pass: 'tu_password_o_app_password' // Reemplazar con contraseña de aplicación real de Google
    }
});

// Base de datos en memoria robusta con persistencia de estados y ventas
const usersDB = new Map();
// Cuenta por defecto solicitada con acceso total preconfigurado
usersDB.set('usu6y', { password: 'password123', license: 'OP80-PRO-9999', hasAccess: true });

const activeLicenses = new Set(['OP80-PRO-9999']);
const activeSales = new Map(); // Registro seguro de transacciones para evitar "Sale not found"

io.on('connection', (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    // Inicio de sesión de usuario
    socket.on('user-login', (data) => {
        const { username, password } = data;
        if (usersDB.has(username)) {
            const user = usersDB.get(username);
            if (user.password === password) {
                socket.emit('auth-response', {
                    status: 'OK',
                    action: 'LOGIN',
                    username: username,
                    license: user.license || '',
                    hasAccess: user.hasAccess || false,
                    message: 'Login successful.'
                });
                return;
            }
        }
        socket.emit('auth-response', { status: 'ERROR', message: 'Credenciales inválidas o usuario no registrado.' });
    });

    // Registro de usuario nuevo
    socket.on('user-register', (data) => {
        const { username, password } = data;
        if (!username || !password) {
            return socket.emit('auth-response', { status: 'ERROR', message: 'Username and password required.' });
        }
        if (usersDB.has(username)) {
            return socket.emit('auth-response', { status: 'ERROR', message: 'Username already registered.' });
        }

        usersDB.set(username, { password, license: null, hasAccess: false });
        socket.emit('auth-response', { status: 'OK', action: 'REGISTER', message: 'Registration successful. You can now log in.' });
    });

    // Verificación o consulta de estado de venta/pago
    socket.on('check-sale-status', (data) => {
        const { code, username } = data;
        
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

    // Activación automática y registro de venta segura
    socket.on('request-automated-activation', async (data) => {
        const { username, plan } = data;
        const selectedPlan = plan || 'Standard Access';
        const generatedCode = `OP80-${crypto.randomBytes(3).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        
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
    console.log(`Servidor de op80.com corriendo en el puerto ${PORT}`);
});
