const WebSocket = require('ws');

// Configurar o servidor para aceitar conexões de qualquer IP
const server = new WebSocket.Server({ 
    port: 8080,
    host: '0.0.0.0' // Isso permite conexões de qualquer IP
});

const clients = new Set();

server.on('connection', (socket, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`Client connected from: ${clientIp}. Total clients: ${clients.size}`);
    clients.add(socket);

    socket.on('message', (message) => {
        try {
            const data = message.toString();
            //console.log(`Received message from ${clientIp}:`, data);
            
            // Broadcast para todos os outros clientes
            clients.forEach(client => {
                if (client !== socket && client.readyState === WebSocket.OPEN) {
                    client.send(data);
                }
            });
        } catch (e) {
            console.error('Error handling message:', e);
        }
    });

    socket.on('close', () => {
        clients.delete(socket);
        console.log(`Client disconnected from ${clientIp}. Total clients: ${clients.size}`);
    });

    socket.on('error', (error) => {
        console.error(`Connection error from ${clientIp}:`, error);
    });
});

server.on('error', (error) => {
    console.error('Server error:', error);
});

console.log('WebSocket server running on 0.0.0.0:8080'); 