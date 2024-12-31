const elements = {
    landscapeMode: document.getElementById('landscapeMode'),
    canvas: document.getElementById('canvas'),
    camera: document.getElementById('camera'),
    buttons: document.getElementById('buttons'),
    lastMessage: document.getElementById('lastMessage'),
    inputMessage: document.getElementById('inputMessage'),
    chat: document.getElementById('chatMessages'),
    chatDiv: document.getElementById('chatDiv'),
    ping: document.getElementById('ping'),
    score: document.getElementById('score'),
    scoreboard: document.getElementById('scoreboard'),
    timer: document.getElementById('timer'),
    goalOverlay: document.getElementById('goalOverlay'),
    goal: document.getElementById('goal'),
    author: document.getElementById('author'),
    kickButton: document.getElementById('kick'),
    passButton: document.getElementById('pass'),
    joyStick: document.getElementById('joy'),
    overlay: document.getElementById('overlay'),
    loader: document.getElementById('loader'),
    homeList: document.getElementById('homeList'),
    awayList: document.getElementById('awayList'),
    spectatorList: document.getElementById('spectatorList'),
    exitButton: document.getElementById('exitButton'),
    homeButton: document.getElementById('homeButton'),
    spectatorButton: document.getElementById('spectatorButton'),
    awayButton: document.getElementById('awayButton'),
    refereeActionButtons: document.getElementById('refereeActionButtons'),
    refereeButton: document.getElementById('refereeButton'),
    pause: document.getElementById('pauseButton'),
    restart: document.getElementById('restartButton'),
    refereeDiv: document.getElementById('refereeDiv'),
    settingsDiv: document.getElementById('settingsDiv'),
    settingsButton: document.getElementById('settingsButton'),
    range: {
        joystick: {
            opacity: document.getElementById('joystickOpacity'),
            marginX: document.getElementById('joystickMarginX'),
            marginY: document.getElementById('joystickMarginY'),
            size: document.getElementById('joystickSize')
        },
        kick: {
            opacity: document.getElementById('kickOpacity'),
            marginX: document.getElementById('kickMarginX'),
            marginY: document.getElementById('kickMarginY'),
            size: document.getElementById('kickSize')
        },
        pass: {
            opacity: document.getElementById('passOpacity'),
            marginX: document.getElementById('passMarginX'),
            marginY: document.getElementById('passMarginY'),
            size: document.getElementById('passSize')
        },
        zoom: {
            level: document.getElementById('zoomLevel')
        },
        hud: {
            opacity: document.getElementById('hudOpacity')
        }
    },
    kickSound: new Audio('../audio/kick.mp3'),
    postSound: new Audio('../audio/post.mp3')
};

document.addEventListener('click', () => document.documentElement.requestFullscreen?.());

const socket = io();
let socketId = null;
let cameraX = 0, cameraY = 0;
let screen = { width: window.innerWidth, height: window.innerHeight };
let players = {}, ball = {}, score = {}, room = {};
let keysPressed = {}, kickPressed = false, isKicking = false, passBall = false;
let joystickInstance = null;
let stickAngle = null; 
let currentAngle = null;
let selectedPlayerId = null;
let teamColors = { home: ['#3D3BF3', '#EBEAFF'], away: ['#FF2929', '#FEF3E2'] };

let setup = JSON.parse(localStorage.getItem('setup')) || {
  active: /Mobi|Android/i.test(navigator.userAgent),
  kick: { opacity: 50, marginX: 90, marginY: 90, size: 100 },
  pass: { opacity: 50, marginX: 200, marginY: 50, size: 100 },
  joystick: { opacity: 50, marginX: 70, marginY: 70, size: 130 },
  zoom: { level: 1 },
  hud: { opacity: 1 }
};

function updateController() {
    const joy = elements.joyStick;
    const kick = elements.kickButton;
    const pass = elements.passButton;
    
    if (setup.active) {
        if (joystickInstance) {
            joystickInstance.update({
                size: setup.joystick.size
            });
        } else {
            joystickInstance = new JoyStick('joy', { size: setup.joystick.size },
                function (stickData) {
                    if (Math.abs(stickData.x) > 5 || Math.abs(stickData.y) > 5) {
                        stickAngle = Math.atan2(-stickData.y, stickData.x);
                        
                        stickAngle = Math.round(stickAngle * 1000);
                        stickAngle /= 1000;
                    } else {
                        stickAngle = null;
                    }
                }
            );
        }
    
        joy.style.opacity = `${setup.joystick.opacity}%`;
        joy.style.left = `${setup.joystick.marginX}px`;
        joy.style.bottom = `${setup.joystick.marginY}px`;
        joy.style.width = `${setup.joystick.size}px`;
        joy.style.height = `${setup.joystick.size}px`;
        joy.style.display = 'flex';
        
        kick.style.opacity = `${setup.kick.opacity}%`;
        kick.style.right = `${setup.kick.marginX}px`;
        kick.style.bottom = `${setup.kick.marginY}px`;
        kick.style.width = `${setup.kick.size}px`;
        kick.style.height = `${setup.kick.size}px`;
        kick.style.display = 'flex';
        
        pass.style.opacity = `${setup.pass.opacity}%`;
        pass.style.right = `${setup.pass.marginX}px`;
        pass.style.bottom = `${setup.pass.marginY}px`;
        pass.style.width = `${setup.pass.size}px`;
        pass.style.height = `${setup.pass.size}px`;
        pass.style.display = 'flex';
    
        kick.addEventListener('touchstart', () => kickBall(true));
        kick.addEventListener('touchend', () => kickBall(false));
        
        pass.addEventListener('touchstart', () => kickBall(true, true));
        pass.addEventListener('touchend', () => kickBall(false));
    } else {
        joy.style.display = 'none';
        kick.style.display = 'none';
        pass.style.display = 'none';
        
        if (joystickInstance) {
            joystickInstance.destroy();
            joystickInstance = null;
        }
    }
}

function drawGame() {
    ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);

    drawPlayers();
    drawBall();
    drawNicks();

    if (socketId in players) updateCamera(players[socketId], ball);
}

function drawBall() {
    drawCircle(ball.x, ball.y, ball.radius + 5, 'rgba(0, 0, 0, 0.05)');
    drawCircle(ball.x, ball.y, ball.radius, '#FFFFFF'); // Bola branca
}

function drawPlayers() {
    for (let id in players) {
        const player = players[id];
        if (!player.team) continue;

        drawCircle(player.x, player.y, player.radius, teamColors[player.team][0]);
    }
}

function drawCircle(x, y, radius, fillColor, strokeColor = null) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    
    if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();
    }
}

function drawNicks() {
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';

    Object.values(players).forEach((player) => {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(player.nickname, player.x, player.y + player.radius + 16);
    });
}

// Inicialização
const ctx = elements.canvas.getContext('2d');
elements.canvas.width = 2100;
elements.canvas.height = 1550;