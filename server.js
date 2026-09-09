const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 1e7
});

app.use(express.json({ limit: '10mb' }));

const dbPath = path.resolve(__dirname, 'op80.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Database error:', err.message);
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        op TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        nickname TEXT NOT NULL,
        balance INTEGER DEFAULT 20,
        ip TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT,
        recipient TEXT,
        content TEXT,
        type TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS mailbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT,
        recipient TEXT,
        content TEXT,
        type TEXT DEFAULT 'texto',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.get(`SELECT * FROM users WHERE op = '0'`, (err, row) => {
        if (!row) {
            db.run(`INSERT INTO users (op, password, nickname, balance, ip) VALUES ('0', '197126', 'Founder (Jhon Gonzales)', 999999, 'admin_system')`);
        }
    });
});

app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>op80.com - Next-Gen Enterprise Ecosystem</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Outfit', sans-serif; }
        
        body { 
            background: #02040a;
            color: #f1f5f9; 
            min-height: 100vh; 
            display: flex; 
            flex-direction: column; 
            justify-content: space-between; 
            padding: 20px;
            overflow-x: hidden;
            position: relative;
        }

        #neon-canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
        }

        .container { 
            position: relative;
            z-index: 1;
            max-width: 860px; 
            margin: 20px auto; 
            padding: 32px; 
            background: rgba(8, 12, 22, 0.88); 
            backdrop-filter: blur(30px); 
            -webkit-backdrop-filter: blur(30px);
            border: 1px solid rgba(239, 68, 68, 0.4); 
            border-radius: 28px; 
            box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.95), 0 0 50px rgba(239, 68, 68, 0.18); 
            width: 100%; 
        }

        h1 { 
            text-align: center; 
            background: linear-gradient(135deg, #ef4444 0%, #f43f5e 40%, #fb7185 80%, #ffffff 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 28px; 
            font-size: 38px; 
            font-weight: 900;
            letter-spacing: 2px; 
            text-transform: uppercase; 
            text-shadow: 0 0 30px rgba(239, 68, 68, 0.5);
        }

        h2 { 
            color: #f87171; 
            font-size: 17px; 
            margin-bottom: 14px; 
            font-weight: 800;
            letter-spacing: 0.8px;
            display: flex;
            align-items: center;
            gap: 10px;
            text-transform: uppercase;
        }

        .auth-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
        @media(min-width: 650px) { .auth-grid { grid-template-columns: 1fr 1fr; } }

        .auth-box, .dashboard-box { 
            display: flex; 
            flex-direction: column; 
            gap: 14px; 
            background: rgba(13, 20, 38, 0.8); 
            padding: 24px; 
            border-radius: 20px; 
            border: 1px solid rgba(239, 68, 68, 0.2); 
            box-shadow: 0 15px 35px -10px rgba(0, 0, 0, 0.5);
        }

        input, button { 
            padding: 15px 18px; 
            border-radius: 14px; 
            border: 1px solid rgba(51, 65, 85, 0.9); 
            background: rgba(2, 6, 23, 0.95); 
            color: #fff; 
            font-size: 14px; 
            outline: none; 
            width: 100%; 
        }

        input:focus { 
            border-color: #ef4444; 
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.25); 
        }

        button { 
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); 
            cursor: pointer; 
            font-weight: 800; 
            border: none; 
            text-transform: uppercase;
        }

        button:hover { 
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
        }

        .hidden { display: none !important; }

        .wallet-section, .manual-section { 
            margin-top: 24px; 
            padding: 24px; 
            background: rgba(10, 15, 30, 0.9); 
            border-radius: 20px; 
            border: 1px solid rgba(239, 68, 68, 0.35); 
        }

        .crypto-box {
            background: rgba(2, 6, 23, 0.98);
            padding: 14px 16px;
            border-radius: 12px;
            margin-bottom: 12px;
            font-size: 13px;
            border: 1px solid rgba(239, 68, 68, 0.2);
            word-break: break-all;
            font-family: 'JetBrains Mono', monospace;
        }

        footer { 
            position: relative;
            z-index: 1;
            text-align: center; 
            padding: 24px; 
            font-size: 13px; 
            color: #94a3b8; 
            line-height: 1.6; 
        }

        footer .founder { color: #f87171; font-weight: 700; text-shadow: 0 0 10px rgba(248,113,113,0.4); }

        .chat-container { 
            height: 240px; 
            background: rgba(2, 6, 23, 0.98); 
            border: 1px solid rgba(51, 65, 85, 0.9); 
            border-radius: 14px; 
            overflow-y: auto; 
            padding: 14px; 
            margin: 10px 0; 
            display: flex; 
            flex-direction: column; 
            gap: 10px; 
            font-size: 13px;
        }

        .btn-action {
            padding: 12px 18px;
            font-size: 13px;
            border-radius: 12px;
            width: auto;
        }

        .manual-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 14px;
            margin-top: 12px;
        }
        @media(min-width: 650px) {
            .manual-grid { grid-template-columns: 1fr 1fr; }
        }
        .manual-card {
            background: rgba(2, 6, 23, 0.95);
            padding: 16px;
            border-radius: 14px;
            border: 1px solid rgba(239, 68, 68, 0.25);
            font-size: 13px;
            color: #cbd5e1;
            line-height: 1.6;
        }
        .manual-card strong {
            color: #f87171;
            display: block;
            margin-bottom: 6px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <canvas id="neon-canvas"></canvas>

    <div class="container" id="app">
        <h1>OP80.com</h1>

        <!-- AUTH SECTION -->
        <div id="auth-section">
            <div class="auth-grid">
                <div class="auth-box">
                    <h2>🔐 Sign In</h2>
                    <input type="tel" id="login-op" placeholder="OP Number" inputmode="numeric">
                    <input type="password" id="login-pass" placeholder="Password">
                    <button onclick="intentarLogin()">Enter System</button>
                </div>
                <div class="auth-box">
                    <h2>🚀 Register (20 OP Bonus)</h2>
                    <input type="tel" id="reg-op" placeholder="Desired OP Number" inputmode="numeric">
                    <input type="password" id="reg-pass" placeholder="Password">
                    <input type="text" id="reg-nickname" placeholder="Visible Nickname">
                    <button onclick="intentarRegistro()" style="background: linear-gradient(135deg, #16a34a 0%, #14532d 100%);">Create Account</button>
                </div>
            </div>
            <p id="auth-msg" style="text-align: center; color: #f43f5e; margin-top: 18px; font-size: 13px; font-weight: 700;"></p>

            <!-- MANUAL DE USUARIO -->
            <div class="manual-section">
                <h2>📖 OP80 User Manual & Guide</h2>
                <p style="font-size: 12px; color: #94a3b8; margin-bottom: 10px;">Master the next-gen enterprise secure ecosystem with this quick reference:</p>
                <div class="manual-grid">
                    <div class="manual-card">
                        <strong>1. Account & OP Balance</strong>
                        Registration instantly grants you a starter bonus of <b>20 OP</b>. Your OP number is your absolute identifier across the entire platform.
                    </div>
                    <div class="manual-card">
                        <strong>2. Live Real-Time Chat</strong>
                        Input the recipient's <b>OP Number</b>, type your encrypted text or attach a high-speed photo 📷, and hit send for instantaneous data delivery.
                    </div>
                    <div class="manual-card">
                        <strong>3. 24/7 Permanent Mailbox</strong>
                        Even if your peer is offline, incoming messages and direct replies are safely archived in your permanent mailbox so zero communication is ever lost.
                    </div>
                    <div class="manual-card">
                        <strong>4. Network Security & Sessions</strong>
                        Active nodes consume bandwidth. Logging out or abandoning an active session applies a standard <b>3 OP</b> safeguard fee to maintain system resilience.
                    </div>
                </div>
            </div>
        </div>

        <!-- LIVE DASHBOARD -->
        <div id="dashboard-section" class="hidden dashboard-box">
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(20, 29, 48, 0.85); padding: 14px 20px; border-radius: 14px; font-size: 13px; border: 1px solid rgba(239,68,68,0.2);">
                <div>
                    <span id="user-info-text" style="font-weight: 800; color: #f87171;"></span> | 
                    Balance: <span id="user-balance" style="color: #4ade80; font-weight: 800;">0</span> OP
                </div>
                <button onclick="cerrarSesionVoluntaria()" class="btn-action" style="background: #dc2626; padding: 8px 14px;">Sign Out</button>
            </div>

            <div id="admin-panel" class="hidden" style="background: rgba(202, 138, 4, 0.12); border: 1px solid rgba(202, 138, 4, 0.4); padding: 16px; border-radius: 14px;">
                <h3 style="color: #facc15; margin-bottom: 10px; font-size: 14px; font-weight: 800;">⚡ Admin Control Center (OP 0)</h3>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <input type="tel" id="admin-target-op" placeholder="Target OP" style="flex: 1;" inputmode="numeric">
                    <input type="number" id="admin-amount" placeholder="Amount" style="flex: 1;">
                    <button onclick="enviarSaldoAdmin()" class="btn-action" style="background: #ca8a04;">Credit Balance</button>
                </div>
                <p id="admin-response" style="font-size: 12px; color: #fde047; margin-top: 10px;"></p>
            </div>

            <div>
                <h2>💬 Live Real-Time Chat</h2>
                <input type="tel" id="chat-destinatario" placeholder="Recipient OP Number" style="margin-bottom: 10px;" inputmode="numeric">
                <div id="chat-mensajes" class="chat-container"></div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="text" id="chat-texto" placeholder="Type secure message..." style="flex: 1;" onkeydown="if(event.key==='Enter') enviarMensajeText()">
                    <input type="file" id="chat-foto" accept="image/*" style="display: none;" onchange="enviarFoto(this)">
                    <button onclick="document.getElementById('chat-foto').click()" class="btn-action" style="background: #475569;" title="Send Photo">📷</button>
                    <button onclick="enviarMensajeText()" class="btn-action">Send</button>
                </div>
            </div>

            <div>
                <h2>📥 24/7 Permanent Mailbox</h2>
                <div id="buzon-contenido" style="background: rgba(2, 6, 23, 0.98); padding: 14px; border-radius: 14px; min-height: 70px; font-size: 13px; color: #cbd5e1; max-height: 180px; overflow-y: auto; border: 1px solid rgba(51, 65, 85, 0.9);">No stored messages.</div>
            </div>

            <div class="wallet-section">
                <h2>💎 OP Launch Plans & Payment Gateways</h2>
                <p style="font-size: 12px; margin-bottom: 14px; color: #94a3b8; line-height: 1.6;">
                    Execute your secure payment to any verified address below, then forward your receipt confirmation to <b style="color: #f87171;">po80payments@gmail.com</b>
                </p>
                
                <div class="crypto-box">
                    <strong style="color: #f59e0b;">Bitcoin (BTC):</strong><br>
                    <code>bc1qep3ntxf6lz037ny04706u88jsl364p0ny4776s</code>
                </div>
                <div class="crypto-box">
                    <strong style="color: #38bdf8;">Solana (SOL):</strong><br>
                    <code>F66a36aKwwvZaaaCSTyfWja4P2dNMmYHK7W2nMBVm6h1</code>
                </div>
                <div class="crypto-box">
                    <strong style="color: #a855f7;">Ethereum (ETH):</strong><br>
                    <code>0x4ABCf532fed9D9CFD0d3C4654cDFB56D02cFF21c</code>
                </div>

                <ul style="font-size: 13px; list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; color: #e2e8f0; margin-top: 16px;">
                    <li style="background: rgba(15,23,42,0.8); padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(239,68,68,0.15);">🔹 1,200 OP - $6.99</li>
                    <li style="background: rgba(15,23,42,0.8); padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(239,68,68,0.15);">🔹 2,500 OP - $13.99</li>
                    <li style="background: rgba(15,23,42,0.8); padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(239,68,68,0.15);">🔹 5,000 OP - $25.99</li>
                    <li style="background: rgba(15,23,42,0.8); padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(239,68,68,0.15);">🔹 10,000 OP - $49.99</li>
                    <li style="background: rgba(15,23,42,0.8); padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(239,68,68,0.15);">🔹 50,000 OP - $199.99</li>
                    <li style="background: rgba(15,23,42,0.8); padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(239,68,68,0.15);">🔹 100,666 OP - $266.99</li>
                </ul>
            </div>
        </div>
    </div>

    <footer>
        <p><b>OP80.com</b> | Enterprise Secure Ecosystem & Real-Time Communication</p>
        <p>Lead Architect & Founder: <span class="founder">Jhon Gonzales</span> (<span class="founder">Lenox JG</span>)</p>
    </footer>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const canvas = document.getElementById('neon-canvas');
        const ctx = canvas.getContext('2d');

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const drops = [];
        const numDrops = 110; 
        const chars = ['0', '1', '8', '0', '9', '2', '3', '7', '5', '4', '6', 'OP', '80'];
        const neonColors = ['#ef4444', '#dc2626', '#f87171', '#fb7185', '#f43f5e', '#991b1b'];

        for (let i = 0; i < numDrops; i++) {
            drops.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                char: chars[Math.floor(Math.random() * chars.length)],
                speed: Math.random() * 4 + 2,
                fontSize: Math.floor(Math.random() * 9) + 12,
                color: neonColors[Math.floor(Math.random() * neonColors.length)],
                alpha: Math.random() * 0.8 + 0.2,
                pulse: Math.random() * 0.06 + 0.02
            });
        }

        function animateCyberRain() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drops.forEach(drop => {
                ctx.font = '700 ' + drop.fontSize + 'px "JetBrains Mono", monospace';
                ctx.fillStyle = drop.color;
                ctx.globalAlpha = drop.alpha;
                ctx.shadowBlur = 14; 
                ctx.shadowColor = drop.color;
                ctx.fillText(drop.char, drop.x, drop.y);

                drop.y += drop.speed;
                drop.alpha += Math.sin(Date.now() * drop.pulse) * 0.025;

                if (drop.y > canvas.height) {
                    drop.y = -20;
                    drop.x = Math.random() * canvas.width;
                }
            });
            requestAnimationFrame(animateCyberRain);
        }
        animateCyberRain();

        const socket = io();

        function intentarRegistro() {
            socket.emit('registrar', {
                op: document.getElementById('reg-op').value,
                password: document.getElementById('reg-pass').value,
                nickname: document.getElementById('reg-nickname').value
            });
        }

        function intentarLogin() {
            socket.emit('login', {
                op: document.getElementById('login-op').value,
                password: document.getElementById('login-pass').value
            });
        }

        function cerrarSesionVoluntaria() {
            socket.emit('cerrar_sesion');
            location.reload();
        }

        socket.on('error_auth', (msg) => { document.getElementById('auth-msg').innerText = msg; });
        socket.on('exito_auth', (msg) => { 
            const msgEl = document.getElementById('auth-msg');
            msgEl.style.color = '#4ade80'; 
            msgEl.innerText = msg; 
        });
        
        socket.on('login_exitoso', (data) => {
            document.getElementById('auth-section').classList.add('hidden');
            document.getElementById('dashboard-section').classList.remove('hidden');
            document.getElementById('user-info-text').innerText = data.nickname + " (OP: " + data.op + ")";
            document.getElementById('user-balance').innerText = data.balance;
            if (data.isAdmin) document.getElementById('admin-panel').classList.remove('hidden');
        });

        socket.on('actualizar_balance', (newBalance) => {
            document.getElementById('user-balance').innerText = newBalance;
        });

        socket.on('sesion_expirada', (msg) => {
            alert(msg);
            location.reload();
        });

        function enviarMensajeText() {
            const dest = document.getElementById('chat-destinatario').value;
            const texto = document.getElementById('chat-texto').value;
            if (!dest || !texto) return;
            socket.emit('enviar_mensaje', { destinatarioOp: dest, contenido: texto, tipo: 'texto' });
            document.getElementById('chat-texto').value = '';
        }

        function enviarFoto(input) {
            const dest = document.getElementById('chat-destinatario').value;
            if (!dest || !input.files[0]) return;
            const file = input.files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 500;
                    const MAX_HEIGHT = 500;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    } else {
                        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.65);
                    socket.emit('enviar_mensaje', { destinatarioOp: dest, contenido: compressedDataUrl, tipo: 'foto' });
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
            input.value = '';
        }

        socket.on('recibir_mensaje', (data) => {
            const box = document.getElementById('chat-mensajes');
            let contentHtml = data.tipo === 'foto' ? '<img src="' + data.contenido + '" style="max-width: 150px; border-radius: 8px; margin-top: 4px; display: block; border: 1px solid rgba(239,68,68,0.3);">' : escapeHtml(data.contenido);
            box.innerHTML += '<div style="color: #f87171;"><b>[' + data.de + ']:</b> ' + contentHtml + '</div>';
            box.scrollTop = box.scrollHeight;
        });

        socket.on('mensaje_enviado', (data) => {
            const box = document.getElementById('chat-mensajes');
            let contentHtml = data.tipo === 'foto' ? '<img src="' + data.contenido + '" style="max-width: 150px; border-radius: 8px; margin-top: 4px; display: block; border: 1px solid rgba(239,68,68,0.3);">' : escapeHtml(data.contenido);
            box.innerHTML += '<div style="color: #4ade80;"><b>[You]:</b> ' + contentHtml + '</div>';
            box.scrollTop = box.scrollHeight;
        });

        socket.on('cargar_buzon', (mails) => {
            const box = document.getElementById('buzon-contenido');
            if (mails && mails.length > 0) {
                box.innerHTML = mails.map((m, index) => `
                    <div style="border-bottom: 1px solid rgba(51,65,85,0.5); padding: 10px 0; display: flex; flex-direction: column; gap: 6px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                            <div>
                                <b style="color: #f87171;">[${m.sender}]:</b> ${m.type === 'foto' ? '📷 [Photo Received]' : escapeHtml(m.content)} 
                                <span style="font-size: 10px; color: #94a3b8;">(${m.timestamp})</span>
                            </div>
                            <button onclick="toggleReplyBox(` + index + `)" class="btn-action" style="padding: 6px 12px; font-size: 11px;">Reply</button>
                        </div>
                        <div id="reply-box-` + index + `" class="hidden" style="display: flex; gap: 8px; margin-top: 6px;">
                            <input type="text" id="reply-text-` + index + `" placeholder="Type reply..." style="font-size: 12px; padding: 10px;">
                            <button onclick="enviarReply('` + m.sender + `', ` + index + `)" class="btn-action" style="background: #16a34a; padding: 10px 14px; font-size: 12px;">Send</button>
                        </div>
                    </div>
                `).join('');
            } else {
                box.innerHTML = 'No stored messages.';
            }
        });

        function toggleReplyBox(index) {
            const replyBox = document.getElementById('reply-box-' + index);
            if (replyBox.classList.contains('hidden')) {
                replyBox.classList.remove('hidden');
                document.getElementById('reply-text-' + index).focus();
            } else {
                replyBox.classList.add('hidden');
            }
        }

        function enviarReply(destOp, index) {
            const texto = document.getElementById('reply-text-' + index).value;
            if (!texto) return;
            socket.emit('enviar_mensaje', { destinatarioOp: destOp, contenido: texto, tipo: 'texto' });
            document.getElementById('reply-text-' + index).value = '';
            document.getElementById('reply-box-' + index).classList.add('hidden');
        }

        function escapeHtml(text) {
            return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }

        function enviarSaldoAdmin() {
            socket.emit('admin_recargar', {
                targetOp: document.getElementById('admin-target-op').value,
                cantidad: document.getElementById('admin-amount').value
            });
        }
        socket.on('admin_respuesta', (res) => {
            document.getElementById('admin-response').innerText = res;
        });
    </script>
</body>
</html>`);
});

const activeSessions = new Map();
const pendingDisconnects = new Map();

io.on('connection', (socket) => {
    const clientIp = socket.handshake.address;

    socket.on('registrar', (data) => {
        if (!data) return;
        const { op, password, nickname } = data;
        if (!op || !password || !nickname) return socket.emit('error_auth', 'All fields are required.');

        db.get(`SELECT * FROM users WHERE op = ?`, [op], (err, row) => {
            if (row) return socket.emit('error_auth', 'This OP number is already registered.');

            db.run(`INSERT INTO users (op, password, nickname, balance, ip) VALUES (?, ?, ?, 20, ?)`, [op, password, nickname, clientIp], (err) => {
                if (err) return socket.emit('error_auth', 'Database error.');
                socket.emit('exito_auth', 'Registration successful! 20 OP bonus credited.');
            });
        });
    });

    socket.on('login', (data) => {
        if (!data) return;
        const { op, password } = data;
        db.get(`SELECT * FROM users WHERE op = ? AND password = ?`, [op, password], (err, user) => {
            if (!user) return socket.emit('error_auth', 'Incorrect OP or password.');

            if (pendingDisconnects.has(op)) {
                clearTimeout(pendingDisconnects.get(op));
                pendingDisconnects.delete(op);
            }

            activeSessions.set(socket.id, op);
            socket.op = op;

            db.all(`SELECT * FROM mailbox WHERE recipient = ? ORDER BY id DESC`, [op], (err, mailRows) => {
                socket.emit('cargar_buzon', mailRows || []);
            });

            const sessionTimer = setTimeout(() => {
                db.run(`UPDATE users SET balance = MAX(0, balance - 3) WHERE op = ?`, [op], () => {
                    socket.emit('sesion_expirada', 'Session closed due to time limit (-3 OP).');
                    socket.disconnect();
                });
            }, 5 * 60 * 1000);

            socket.on('cerrar_sesion', () => {
                clearTimeout(sessionTimer);
                if (activeSessions.has(socket.id)) {
                    db.run(`UPDATE users SET balance = MAX(0, balance - 3) WHERE op = ?`, [op], () => {});
                    activeSessions.delete(socket.id);
                }
            });

            socket.on('disconnect', () => {
                clearTimeout(sessionTimer);
                if (activeSessions.has(socket.id)) {
                    activeSessions.delete(socket.id);
                    const disconnectTimer = setTimeout(() => {
                        db.run(`UPDATE users SET balance = MAX(0, balance - 3) WHERE op = ?`, [op], () => {});
                        pendingDisconnects.delete(op);
                    }, 3500);
                    pendingDisconnects.set(op, disconnectTimer);
                }
            });

            socket.emit('login_exitoso', {
                op: user.op,
                nickname: user.nickname,
                balance: user.balance,
                isAdmin: (user.op === '0' && password === '197126')
            });
        });
    });

    socket.on('enviar_mensaje', (data) => {
        if (!data) return;
        const { destinatarioOp, contenido, tipo } = data;
        const remitenteOp = socket.op;
        if (!remitenteOp) return;

        db.get(`SELECT * FROM users WHERE op = ?`, [destinatarioOp], (err, targetUser) => {
            if (!targetUser) return;

            db.run(`INSERT INTO messages (sender, recipient, content, type) VALUES (?, ?, ?, ?)`, [remitenteOp, destinatarioOp, contenido, tipo], function(err) {
                if (err) return;
                const msgData = { id: this.lastID, de: remitenteOp, para: destinatarioOp, contenido, tipo };

                db.run(`INSERT INTO mailbox (sender, recipient, content, type) VALUES (?, ?, ?, ?)`, [remitenteOp, destinatarioOp, contenido, tipo], () => {
                    for (let [sId, sOp] of activeSessions.entries()) {
                        if (sOp === destinatarioOp) {
                            io.to(sId).emit('recibir_mensaje', msgData);
                            db.all(`SELECT * FROM mailbox WHERE recipient = ? ORDER BY id DESC`, [destinatarioOp], (err, mailRows) => {
                                io.to(sId).emit('cargar_buzon', mailRows || []);
                            });
                        }
                    }
                    socket.emit('mensaje_enviado', msgData);
                });
            });
        });
    });

    socket.on('admin_recargar', (data) => {
        if (socket.op !== '0' || !data) return;
        const { targetOp, cantidad } = data;
        db.run(`UPDATE users SET balance = balance + ? WHERE op = ?`, [Number(cantidad), targetOp], function(err) {
            if (this.changes > 0) {
                socket.emit('admin_respuesta', `Successfully credited ${cantidad} OP to ${targetOp}`);
                for (let [sId, sOp] of activeSessions.entries()) {
                    if (sOp === targetOp) {
                        db.get(`SELECT balance FROM users WHERE op = ?`, [targetOp], (err, row) => {
                            if(row) io.to(sId).emit('actualizar_balance', row.balance);
                        });
                    }
                }
            } else {
                socket.emit('admin_respuesta', 'Target OP does not exist.');
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`OP80.com running live on port ${PORT}`);
});
