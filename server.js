const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Carpeta pública para los archivos visuales (HTML, CSS)
app.use(express.static(path.join(__dirname, 'public')));

// Base de datos simulada en memoria (puedes cambiarla por MongoDB o PostgreSQL en Render más adelante)
// Aquí controlamos usuarios, licencias, tiempos de vida y códigos de canje
const dbLicencias = {
    // Ejemplo: "usuario1": { password: "123", expiresAt: Date.now() + 90*24*60*60*1000, active: true }
};

// Conexión en tiempo real con WebSockets
io.on('connection', (socket) => {
    console.log('Un dispositivo o panel se ha conectado en tiempo real.');

    // Recibir datos de ubicación GPS e IP desde el APK de Android
    socket.on('enviar_ubicacion', (data) => {
        const { username, lat, lng, ipTelefono, ipIntruso } = data;
        
        // Verificamos si la suscripción sigue activa
        // Si el tiempo de vida expiró, bloqueamos la transmisión en vivo
        console.log(`Datos recibidos de ${username}: Lat ${lat}, Lng ${lng} | IP Tel: ${ipTelefono} | IP Intruso: ${ipIntruso}`);
        
        // Reenviar la información en tiempo real únicamente al panel web del usuario
        io.emit(`actualizar_mapa_${username}`, {
            lat,
            lng,
            ipTelefono,
            ipIntruso,
            timestamp: new Date()
        });
    });

    socket.on('disconnect', () => {
        console.log('Dispositivo desconectado.');
    });
});

// Puerto dinámico asignado por Render o por defecto el 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`op80.com corriendo en vivo en el puerto ${PORT}`);
});

