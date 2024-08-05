// 导入 WebSocket 模块
import {WebSocketServer} from 'ws';

// 创建一个 WebSocket 服务器实例，监听在指定端口
const wss = new WebSocketServer({ port: 8080 });

// 监听连接事件
wss.on('connection', function connection(ws) {
    // 当有客户端连接时，打印连接成功的消息
    console.log('Client connected');
    
    // 监听客户端发送的消息
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
        
        // 回复客户端收到的消息
        ws.send(`Received: ${message}`);
    });
    
    // 监听关闭事件
    ws.on('close', function close() {
        console.log('Client disconnected');
    });
    
    // 发送初始消息给客户端
    ws.send('Hello, client!');
});
