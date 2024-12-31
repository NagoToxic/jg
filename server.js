const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal para servir o arquivo index.html
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Erro ao enviar index.html:', err);
      res.status(500).send('Erro ao carregar a página.');
    }
  });
});

// Rota para o manifest.json
app.get('/manifest.json', (req, res) => {
  const manifestPath = path.join(__dirname, 'manifest.json');
  res.sendFile(manifestPath, (err) => {
    if (err) {
      console.error('Erro ao enviar manifest.json:', err);
      res.status(404).send('Manifest não encontrado.');
    }
  });
});

// Servir arquivos estáticos adicionais
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Socket.IO setup
io.on('connection', (socket) => {
  console.log('Um usuário conectou:', socket.id);

  // Escutando desconexões
  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.id);
  });

  // Exemplo de evento personalizado
  socket.on('ping', (callback) => {
    console.log(`Ping recebido de ${socket.id}`);
    callback();
  });
});

// Validação de existência de diretórios/arquivos
const validatePaths = () => {
  const requiredPaths = [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'manifest.json'),
    path.join(__dirname, 'js'),
    path.join(__dirname, 'css'),
    path.join(__dirname, 'images'),
  ];

  requiredPaths.forEach((filePath) => {
    if (!path.isAbsolute(filePath) || !require('fs').existsSync(filePath)) {
      console.warn(`Caminho ausente ou inválido: ${filePath}`);
    }
  });
};

// Validar os caminhos antes de iniciar o servidor
validatePaths();

// Iniciar o servidor
const PORT = process.env.PORT || 8902;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});