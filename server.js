const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

const usersDB = new Map();
usersDB.set('usu6y', { password: 'password123', license: 'OP80-PRO-9999', hasAccess: true });

const activeLicenses = new Set(['OP80-PRO-9999']);
const bannedDevices = new Set();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || 'po80payments@gmail.com',
        pass: process.env.SMTP_PASS || ''
    }
});

io.on('connection', (socket) => {
    const remoteIp = socket.handshake.headers['x-forwarded-for'] || socket.conn.remoteAddress;

    socket.on('security-breach-detected', (data) => {
        const deviceId = data.deviceId || 'unknown';
        bannedDevices.add(deviceId);
        console.warn(`[SECURITY ALERT] Tampering detected from IP ${remoteIp}. Device ${deviceId} permanently locked.`);
        socket.emit('device-permanently-locked', { message: 'Security breach detected. Device locked.' });
    });

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

    socket.on('user-login', (data) => {
        const { username, password } = data;
        const user = usersDB.get(username);

        if (!user || user.password !== password) {
            return socket.emit('auth-response', { status: 'ERROR', message: 'Invalid username or password.' });
        }

        socket.emit('auth-response', { 
            status: 'OK', 
            action: 'LOGIN', 
            username: username,
            hasAccess: user.hasAccess,
            license: user.license,
            message: 'Login successful.' 
        });
    });

    socket.on('request-automated-activation', async (data) => {
        const { username, plan } = data;
        const selectedPlan = plan || 'Standard Access';
        const generatedCode = `OP80-${crypto.randomBytes(3).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        
        activeLicenses.add(generatedCode);
        
        if (usersDB.has(username)) {
            const user = usersDB.get(username);
            user.license = generatedCode;
            user.hasAccess = true;
        }

        try {
            await transporter.sendMail({
                from: '"op80.com Gateway" <po80payments@gmail.com>',
                to: 'po80payments@gmail.com',
                subject: `[AUTO-PAYMENT] User: ${username} | Plan: ${selectedPlan}`,
                text: `Verified payment order registered on op80.com.\n\nUser: ${username}\nPlan: ${selectedPlan}\nClient IP: ${remoteIp}\nLicense Code: ${generatedCode}\n\nVerify BTC arrival in wallet (bc1qep3ntxf6lz037ny04706u88jsl364p0ny4776s).`
            });
        } catch (err) {
            console.log("Mail dispatch note:", err.message);
        }

        socket.emit('activation-dispatched', {
            code: generatedCode,
            message: 'Payment registered. System unlocked successfully.'
        });
    });
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[op80.com] Ultimate core running on port ${PORT}`);
});
