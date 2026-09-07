const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Base de datos en memoria para múltiples usuarios y licencias
// Estructura: { username: { password, expiresAt, activo, codigoCanjeado } }
const baseDeDatosUsuarios = {};

// Códigos de activación válidos generados por tu equipo (po80payments@gmail.com)
// Puedes agregar más códigos según los pagos en BTC recibidos en bc1qep3ntxf6lz037ny04706u88jsl364p0ny4776s
const codigosValidos = {
    "OP80-3MESES-99": { duracion: 90 * 24 * 60 * 60 * 1000, usado: false },
    "OP80-6MESES-16": { duracion: 180 * 24 * 60 * 60 * 1000, usado: false },
    "OP80-12MESES-30": { duracion: 365 * 24 * 60 * 60 * 1000, usado: false }
};

// Registro de nuevos usuarios
app.post('/api/registrar', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Faltan datos de registro" });
    }
    if (baseDeDatosUsuarios[username]) {
        return res.status(400).json({ error: "El usuario ya existe" });
    }

    baseDeDatosUsuarios[username] = {
        password: password,
        expiresAt: 0, // Sin tiempo hasta que canjeen un código
        activo: false
    };

    res.json({ status: "success", message: "Usuario registrado con éxito. Inicia sesión para canjear tu código." });
});

// Canje de código de activación (Enviado por po80payments@gmail.com)
app.post('/api/canjear', (req, res) => {
    const { username, password, codigo } = req.body;
    const user = baseDeDatosUsuarios[username];

    if (!user || user.password !== password) {
        return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const licenciaInfo = codigosValidos[codigo];
    if (!licenciaInfo || licenciaInfo.usado) {
        return res.status(400).json({ error: "Código inválido o ya utilizado" });
    }

    // Activar tiempo de vida de la suscripción
    licenciaInfo.usado = true;
    user.expiresAt = Date.now() + licenciaInfo.duracion;
    user.activo = true;

    res.json({ 
        status: "success", 
        message: "¡Licencia activada con éxito!", 
        expiresAt: user.expiresAt 
    });
});

// Endpoint para que el APK de Android reporte ubicación y doble IP en tiempo real
app.post('/api/reportar', (req, res) => {
    const { username, password, lat, lng, ipTelefono, ipIntruso } = req.body;
    const user = baseDeDatosUsuarios[username];

    if (!user || user.password !== password) {
        return res.status(401).json({ error: "No autorizado" });
    }

    // Verificar si el tiempo de vida de la suscripción expiró
    if (Date.now() > user.expiresAt || !user.activo) {
        return res.status(403).json({ error: "Suscripción expirada. Transmisión bloqueada." });
    }

    // Emitir datos en vivo al panel específico del usuario
    io.emit(`actualizar_mapa_${username}`, {
        lat,
        lng,
        ipTelefono: ipTelefono || "Desconocida",
        ipIntruso: ipIntruso || null,
        timestamp: Date.now()
    });

    res.json({ status: "success" });
});

io.on('connection', (socket) => {
    console.log('Cliente conectado al sistema en vivo de op80.com');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`op80.com operando en el puerto ${PORT}`);
});
