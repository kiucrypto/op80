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
app.use(express.urlencoded({ extended: true }));

const ROOT_DIR = path.resolve(__dirname);
console.log(`[op80.com] Servidor apuntando al directorio raíz: ${ROOT_DIR}`);

app.use(express.static(ROOT_DIR));

const server = http.createServer(app);
const io = new Server(server, { 
    cors: { origin: "*" },
    pingTimeout: 60000,
    pingInterval: 25000
});

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || 'po80payments@gmail.com',
        pass: process.env.SMTP_PASS || ''
    }
});

const usersDB = new Map();
usersDB.set('usu6y', { password: 'password123', license: 'OP80-PRO-9999', hasAccess: true });

const activeLicenses = new Set(['OP80-PRO-9999']);
const activeSales = new Map();
const bannedDevices = new Set();

io.on('connection', (socket) => {
    const remoteIp = socket.handshake.headers['x-forwarded-for'] || socket.conn.remoteAddress;

    socket.on('security-breach-detected', (data) => {
        const deviceId = data?.deviceId || 'unknown';
        bannedDevices.add(deviceId);
        socket.emit('device-permanently-locked', { message: 'Security breach detected. Device locked.' });
    });

    socket.on('user-register', (data) => {
        try {
            const { username, password } = data || {};
            if (!username || !password) {
                return socket.emit('auth-response', { status: 'ERROR', message: 'Username and password required.' });
            }
            if (usersDB.has(username)) {
                return socket.emit('auth-response', { status: 'ERROR', message: 'Username already registered.' });
            }

            usersDB.set(username, { password, license: null, hasAccess: false });
            socket.emit('auth-response', { status: 'OK', action: 'REGISTER', message: 'Registration successful. You can now log in.' });
        } catch (err) {
            socket.emit('auth-response', { status: 'ERROR', message: 'Internal server registration error.' });
        }
    });

    socket.on('user-login', (data) => {
        try {
            const { username, password } = data || {};
            const user = usersDB.get(username);

            if (!user || user.password !== password) {
                return socket.emit('auth-response', { status: 'ERROR', message: 'Invalid username or password.' });
            }

            socket.emit('auth-response', { 
                status: 'OK', 
                action: 'LOGIN', 
                username: username,
                hasAccess: user.hasAccess,
                license: user.license || '',
                message: 'Login successful.' 
            });
        } catch (err) {
            socket.emit('auth-response', { status: 'ERROR', message: 'Internal server login error.' });
        }
    });

    socket.on('check-sale-status', (data) => {
        try {
            const { code } = data || {};
            if (activeSales.has(code) || activeLicenses.has(code)) {
                const saleInfo = activeSales.get(code) || { status: 'VERIFIED', username: 'usu6y' };
                socket.emit('sale-status-result', { found: true, status: 'VERIFIED', sale: saleInfo });
            } else {
                socket.emit('sale-status-result', { found: false, status: 'NOT_FOUND', message: 'Sale not found.' });
            }
        } catch (err) {
            socket.emit('sale-status-result', { found: false, status: 'ERROR', message: 'Error checking sale status.' });
        }
    });

    socket.on('request-automated-activation', async (data) => {
        try {
            const { username, plan } = data || {};
            const selectedPlan = plan || 'Standard Access';
            const generatedCode = `OP80-${crypto.randomBytes(3).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
            
            activeLicenses.add(generatedCode);
            activeSales.set(generatedCode, { username: username || 'Anónimo', plan: selectedPlan, timestamp: Date.now(), status: 'VERIFIED' });
            
            if (username && usersDB.has(username)) {
                const user = usersDB.get(username);
                user.license = generatedCode;
                user.hasAccess = true;
            }

            try {
                await transporter.sendMail({
                    from: '"op80.com Gateway" <po80payments@gmail.com>',
                    to: 'po80payments@gmail.com',
                    subject: `[AUTO-PAYMENT] User: ${username || 'N/A'} | Plan: ${selectedPlan}`,
                    text: `Verified payment order registered on op80.com.\n\nUser: ${username || 'N/A'}\nPlan: ${selectedPlan}\nClient IP: ${remoteIp}\nLicense Code: ${generatedCode}\n\nVerify BTC arrival in wallet (bc1qep3ntxf6lz037ny04706u88jsl364p0ny4776s).`
                });
            } catch (mailErr) {
                console.log("Mail warning:", mailErr.message);
            }

            socket.emit('activation-dispatched', {
                code: generatedCode,
                message: 'Payment registered and sale successfully logged. System unlocked.'
            });
        } catch (err) {
            socket.emit('activation-dispatched', { code: 'ERROR', message: 'Activation failed due to server exception.' });
        }
    });
});

app.get('*', (req, res) => {
    const targetFile = path.join(ROOT_DIR, 'index.html');
    res.sendFile(targetFile, (err) => {
        if (err) {
            console.error("Error crítico: index.html no encontrado en:", targetFile);
            res.status(500).send('op80.com Gateway Error: index.html missing from root directory.');
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[op80.com] Production core operational on port ${PORT}`);
});
