import { io } from "socket.io-client";

// Conectar ao servidor
const socket = io('http://localhost:8902'); // Altere o URL se necessário

// Ouvir o evento 'welcome' do servidor
socket.on('welcome', (message) => {
    console.log(message); // Exibe "Bem-vindo ao servidor!"
});

// Enviar uma mensagem para o servidor
socket.emit('message', 'Olá servidor!');

// Exemplo de como lidar com erros de conexão
socket.on('connect_error', (error) => {
    console.log('Erro de conexão:', error);
});
