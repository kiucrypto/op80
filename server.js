const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e7 });

app.use(express.json({ limit: '10mb' }));

const dbPath = path.resolve(__dirname, 'op80.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('DB error:', err.message);
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (op TEXT PRIMARY KEY, password TEXT NOT NULL, nickname TEXT NOT NULL, balance INTEGER DEFAULT 20, ip TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, recipient TEXT, content TEXT, type TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    db.run(`CREATE TABLE IF NOT EXISTS mailbox (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, recipient TEXT, content TEXT, type TEXT DEFAULT 'texto', timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    
    db.get(`SELECT * FROM users WHERE op = '0'`, (err, row) => {
        if (!row) db.run(`INSERT INTO users (op, password, nickname, balance, ip) VALUES ('0', '197126', 'Founder', 999999, 'admin')`);
    });
});

app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>op80.com</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Outfit', sans-serif; }
        body { background: #02040a; color: #f1f5f9; min-height: 100vh; display: flex; flex-direction: column; justify-content: space-between; padding: 20px; overflow-x: hidden; position: relative; }
        #neon-canvas { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
        .container { position: relative; z-index: 1; max-width: 860px; margin: 20px auto; padding: 32px; background: rgba(8, 12, 22, 0.9); backdrop-filter: blur(20px); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 28px; box-shadow: 0 20px 50px rgba(0,0,0,0.8); width: 100%; }
        h1 { text-align: center; background: linear-gradient(135deg, #ef4444 0%, #f43f5e 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 24px; font-size: 36px; font-weight: 900; letter-spacing: 2px; }
        h2 { color: #f87171; font-size: 16px; margin-bottom: 12px; font-weight: 800; text-transform: uppercase; }
        .auth-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        @media(min-width: 650px) { .auth-grid { grid-template-columns: 1fr 1fr; } }
        .auth-box, .dashboard-box { display: flex; flex-direction: column; gap: 12px; background: rgba(13, 20, 38, 0.8); padding: 20px; border-radius: 16px; border: 1px solid rgba(239, 68, 68, 0.2); }
        input, button { padding: 14px 16px; border-radius: 12px; border: 1px solid rgba(51, 65, 85, 0.9); background: rgba(2, 6, 23, 0.95); color: #fff; font-size: 14px; outline: none; width: 100%; }
        input:focus { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2); }
        button { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); cursor: pointer; font-weight: 800; border: none; text-transform: uppercase; }
        button:hover { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
        .hidden { display: none !important; }
        .crypto-box { background: rgba(2, 6, 23, 0.95); padding: 12px; border-radius: 10px; margin-bottom: 10px; font-size: 12px; border: 1px solid rgba(239, 68, 68, 0.2); font-family: 'JetBrains Mono', monospace; word-break: break-all; }
        footer { position: relative; z-index: 1; text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; }
        .chat-container { height: 220px; background: rgba(2, 6, 23, 0.95); border: 1px solid rgba(51, 65, 85, 0.9); border-radius: 12px; overflow-y: auto; padding: 12px; margin: 8px 0; display: flex; flex-direction: column; gap: 8px; font-size: 13px; }
        .btn-action { padding: 10px 16px; font-size: 12px; width: auto; }
    </style>
</head>
<body>
    <canvas id="neon-canvas"></canvas>
    <div class="container">
        <h1>OP80.com</h1>
        <div id="auth-section">
            <div class="auth-grid">
                <div class="auth-box">
                    <h2>🔐 Sign In</h2>
                    <input type="tel" id="login-op" placeholder="OP Number">
                    <input type="password" id="login-pass" placeholder="Password">
                    <button onclick="intentarLogin()">Enter System</button>
                </div>
                <div class="auth-box">
                    <h2>🚀 Register (20 OP Bonus)</h2>
                    <input type="tel" id="reg-op" placeholder="Desired OP Number">
                    <input type="password" id="reg-pass" placeholder="Password">
                    <input type="text" id="reg-nickname" placeholder="Visible Nickname">
                    <button onclick="intentarRegistro()" style="background: linear-gradient(135deg, #16a34a 0%, #14532d 100%);">Create Account</button>
                </div>
            </div>
            <p id="auth-msg" style="text-align: center; color: #f43f5e; margin-top: 15px; font-size: 13px; font-weight: 700;"></p>
        </div>

        <div id="dashboard-section" class="hidden dashboard-box">
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(20, 29, 48, 0.85); padding: 12px 16px; border-radius: 12px; font-size: 13px;">
                <div><span id="user-info-text" style="font-weight: 800; color: #f87171;"></span> | Balance: <span id="user-balance" style="color: #4ade80; font-weight: 800;">0</span> OP</div>
                <button onclick="location.reload()" class="btn-action" style="background: #dc2626;">Sign Out</button>
            </div>

            <div id="admin-panel" class="hidden" style="background: rgba(202, 138, 4, 0.12); border: 1px solid rgba(202, 138, 4, 0.4); padding: 14px; border-radius: 12px;">
                <h3 style="color: #facc15; margin-bottom: 8px; font-size: 13px; font-weight: 800;">⚡ Admin Control Center (OP 0)</h3>
                <div style="display: flex; gap: 8px;">
                    <input type="tel" id="admin-target-op" placeholder="Target OP" style="font-size: 12px;">
                    <input type="number" id="admin-amount" placeholder="Amount" style="font-size: 12px;">
                    <button onclick="enviarSaldoAdmin()" class="btn-action" style="background: #ca8a04;">Credit</button>
                </div>
                <p id="admin-response" style="font-size: 11px; color: #fde047; margin-top: 6px;"></p>
            </div>

            <div>
                <h2>💬 Live Real-Time Chat</h2>
                <input type="tel" id="chat-destinatario" placeholder="Recipient OP Number" style="margin-bottom: 8px; font-size: 12px;">
                <div id="chat-mensajes" class="chat-container"></div>
                <div style="display: flex; gap: 8px;">
                    <input type="text" id="chat-texto" placeholder="Type secure message..." style="flex: 1; font-size: 12px;" onkeydown="if(event.key==='Enter') enviarMensaje()">
                    <button onclick="enviarMensaje()" class="btn-action">Send</button>
                </div>
            </div>

            <div style="margin-top: 15px; padding: 16px; background: rgba(10, 15, 30, 0.9); border-radius: 14px; border: 1px solid rgba(239, 68, 68, 0.3);">
                <h2>💎 OP Launch Plans & Gateways</h2>
                <p style="font-size: 11px; margin-bottom: 10px; color: #94a3b8;">Send payment and forward receipt to <b style="color: #f87171;">po80payments@gmail.com</b></p>
                <div class="crypto-box"><strong>BTC:</strong> bc1qep3ntxf6lz037ny04706u88jsl364p0ny4776s</div>
                <div class="crypto-box"><strong>SOL:</strong> F66a36aKwwvZaaaCSTyfWja4P2dNMmYHK7W2nMBVm6h1</div>
                <div class="crypto-box"><strong>ETH:</strong> 0x4ABCf532fed9D9CFD0d3C4654cDFB56D02cFF21c</div>
            </div>
        </div>
    </div>
    <footer>OP80.com | Secure Ecosystem</footer>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const canvas = document.getElementById('neon-canvas');
        const ctx = canvas.getContext('2d');
        function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
        window.addEventListener('resize', resize); resize();

        const drops = [];
        const chars = ['0', '1', '8', 'OP'];
        const colors = ['#ef4444', '#f87171', '#dc2626'];
        for (let i = 0; i < 80; i++) {
            drops.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, char: chars[Math.floor(Math.random()*chars.length)], speed: Math.random()*3+2, size: Math.random()*8+10, color: colors[Math.floor(Math.random()*colors.length)] });
        }
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drops.forEach(d => {
                ctx.font = '700 ' + d.size + 'px monospace'; ctx.fillStyle = d.color; ctx.shadowBlur = 10; ctx.shadowColor = d.color;
                ctx.fillText(d.char, d.x, d.y);
                d.y += d.speed;
                if (d.y > canvas.height) { d.y = -20; d.x = Math.random() * canvas.width; }
            });
            requestAnimationFrame(draw);
        }
        draw();

        const socket = io();
        function intentarRegistro() { socket.emit('registrar', { op: document.getElementById('reg-op').value, password: document.getElementById('reg-pass').value, nickname: document.getElementById('reg-nickname').value }); }
        function intentarLogin() { socket.emit('login', { op: document.getElementById('login-op').value, password: document.getElementById('login-pass').value }); }
        
        socket.on('error_auth', msg => document.getElementById('auth-msg').innerText = msg);
        socket.on('exito_auth', msg => { const m = document.getElementById('auth-msg'); m.style.color = '#4ade80'; m.innerText = msg; });
        socket.on('login_exitoso', data => {
            document.getElementById('auth-section').classList.add('hidden');
            document.getElementById('dashboard-section').classList.remove('hidden');
            document.getElementById('user-info-text').innerText = data.nickname + " (OP: " + data.op + ")";
            document.getElementById('user-balance').innerText = data.balance;
            if (data.isAdmin) document.getElementById('admin-panel').classList.remove('hidden');
        });
        socket.on('actualizar_balance', b => document.getElementById('user-balance').innerText = b);
        socket.on('sesion_expirada', m => { alert(m); location.reload(); });

        function enviarMensaje() {
            const dest = document.getElementById('chat-destinatario').value;
            const texto = document.getElementById('chat-texto').value;
            if (!dest || !texto) return;
            socket.emit('enviar_mensaje', { destinatarioOp: dest, contenido: texto, tipo: 'texto' });
            document.getElementById('chat-texto').value = '';
        }
        socket.on('recibir_mensaje', d => {
            const box = document.getElementById('chat-mensajes');
            box.innerHTML += '<div style="color: #f87171;"><b>[' + d.de + ']:</b> ' + d.contenido + '</div>';
            box.scrollTop = box.scrollHeight;
        });
        socket.on('mensaje_enviado', d => {
            const box = document.getElementById('chat-mensajes');
            box.innerHTML += '<div style="color: #4ade80;"><b>[You]:</b> ' + d.contenido + '</div>';
            box.scrollTop = box.scrollHeight;
        });
        function enviarSaldoAdmin() {
            socket.emit('admin_recargar', { targetOp: document.getElementById('admin-target-op').value, cantidad: document.getElementById('admin-amount').value });
        }
        socket.on('admin_respuesta', r => document.getElementById('admin-response').innerText = r);
    </script>
</body>
</html>`);
});

const activeSessions = new Map();
io.on('connection', (socket) => {
    socket.on('registrar', data => {
        if (!data) return;
        db.run(`INSERT INTO users (op, password, nickname, balance, ip) VALUES (?, ?, ?, 20, ?)`, [data.op, data.password, data.nickname, socket.handshake.address], err => {
            if (err) socket.emit('error_auth', 'OP already exists or invalid.');
            else socket.emit('exito_auth', 'Registered successfully! 20 OP credited.');
        });
    });
    socket.on('login', data => {
        if (!data) return;
        db.get(`SELECT * FROM users WHERE op = ? AND password = ?`, [data.op, data.password], (err, user) => {
            if (!user) return socket.emit('error_auth', 'Incorrect OP or password.');
            activeSessions.set(socket.id, user.op);
            socket.op = user.op;
            socket.emit('login_exitoso', { op: user.op, nickname: user.nickname, balance: user.balance, isAdmin: (user.op === '0' && data.password === '197126') });
        });
    });
    socket.on('enviar_mensaje', data => {
        if (!data || !socket.op) return;
        db.run(`INSERT INTO messages (sender, recipient, content, type) VALUES (?, ?, ?, ?)`, [socket.op, data.destinatarioOp, data.contenido, data.tipo], function() {
            const msg = { id: this.lastID, de: socket.op, contenido: data.contenido };
            socket.emit('mensaje_enviado', msg);
            for (let [sId, sOp] of activeSessions.entries()) {
                if (sOp === data.destinatarioOp) io.to(sId).emit('recibir_mensaje', msg);
            }
        });
    });
    socket.on('admin_recargar', data => {
        if (socket.op !== '0' || !data) return;
        db.run(`UPDATE users SET balance = balance + ? WHERE op = ?`, [Number(data.cantidad), data.targetOp], function() {
            if (this.changes > 0) {
                socket.emit('admin_respuesta', 'Credited successfully');
                for (let [sId, sOp] of activeSessions.entries()) {
                    if (sOp === data.targetOp) {
                        db.get(`SELECT balance FROM users WHERE op = ?`, [data.targetOp], (e, r) => { if(r) io.to(sId).emit('actualizar_balance', r.balance); });
                    }
                }
            } else {
                socket.emit('admin_respuesta', 'OP not found');
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Running on port ${PORT}`));
