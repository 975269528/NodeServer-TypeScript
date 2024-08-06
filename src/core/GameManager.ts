import {WebSocketServer} from "ws";
// 该文件会在dev的时候自动生成,不要手动修改
// @ts-ignore
import Models from "./Models";

let eventLoop = false
//事件循环函数存储
let eventFunc: Function[] = []
//可调用类对象存储
let classMap: { [key: string]: any } = Models;
//Websocket服务端对象
let Server: WebSocketServer
//setInterval返回值,可用于关闭循环
let loopResult: any
// 存储事件和对应的处理函数
let events: { [key: string]: any[] } = {}

//游戏服务管理器
export class GameManager {
    //启动服务器
    static run() {
        let port: number = parseInt(process.env.WEBSOCKET_PORT || '');
        if (!isNaN(port)) {
            // 如果成功解析为整数，则使用该端口创建 WebSocketServer
            Server = new WebSocketServer({port: port})
            console.log('端口解析为:', port, '服务器已启动')
        } else {
            // 如果无法解析为整数，则输出错误信息并结束函数或程序
            console.log('WebSocketServer 端口设置错误: ', process.env.WEBSOCKET_PORT)
            return
        }
        
        Server.on('connection', (ws, req) => {
            
            //客户端地址
            const clientAddress = req.socket.remoteAddress
            //客户端端口
            //const clientPort = req.socket.remotePort
            
            console.log("用户[" + clientAddress + "] 进入连接");
            
            ws.on('message', (msg) => {
                try {
                    //解析数据
                    console.log('message收到的原始消息', msg.toString())
                    let {className, method, data} = JSON.parse(msg.toString())
                    //调用已注册方法
                    let tag = new Struct(clientAddress, ws, className, method)
                    this.call(tag, className, method, data)
                } catch (e) {
                    console.log(e)
                }
            })
            ws.on('close', () => {
                this.unsubscribe2(ws)
                console.log('close用户断开连接' + clientAddress);
            })
            ws.on('error', (err) => {
                console.log('error用户异常断开' + clientAddress);
                console.log(err);
            })
        })
    }
    
    //调用类方法且传递参数
    static call(tag: Struct, className: string, method: string, data: any) {
        //判断类方法是否存在
        try {
            if (typeof classMap[className][method] === 'function') {
                //调用类方法传递参数
                classMap[className][method](tag, data)
            } else {
                console.log('调用类方法失败:', className, method)
            }
        } catch (e) {
            console.log('call发生错误:' + e)
        }
    }
    
    //发送消息到客户端
    static send(tag: Struct, data: any) {
        try {
            tag.ws.send(JSON.stringify({
                eventName: 0,
                className: tag.className,
                method: tag.method,
                data: data
            }))
        } catch (e) {
            console.log(e)
        }
    }
    
    //开启事件循环 delay = 间隔毫秒
    static openEventLoop(delay: number) {
        //如果已开启则忽略操作
        if (!eventLoop) {
            //限制一下,防止设置过快,1秒60帧约等于16毫秒间隔,可以用了
            delay = delay < 16 ? 16 : delay
            eventLoop = true
            loopResult = setInterval(() => {
                //需要重复执行的函数
                eventFunc.forEach((func) => {
                    func()
                })
            }, delay)
        }
    }
    
    //关闭事件循环
    static closeEventLoop() {
        //判断循环是否已开启
        if (eventLoop) {
            clearInterval(loopResult)
            eventLoop = false
        }
    }
    
    //添加定时循环函数
    static addEventLoopFunc(handler: Function) {
        //检查是否已存在,不存在则添加
        if (!eventFunc.includes(handler)) {
            eventFunc.push(handler)
        }
    }
    
    //删除定时循环函数
    static removeEventLoopFunc(handler: Function) {
        //查找要删除的函数,如果不存在则返回 -1,否则删除指定元素
        let index = eventFunc.indexOf(handler)
        if (index !== -1) {
            eventFunc.splice(index, 1)
        }
    }
    
    // 订阅事件
    static subscribe(eventName: string, client: WebSocket) {
        try {
            if (!events[eventName]) {
                events[eventName] = [];
            }
            // 检查是否已经订阅过该客户端，避免重复订阅
            if (!events[eventName].includes(client)) {
                events[eventName].push(client);
            } else {
                console.log('subscribe 客户端已存在,不可重复订阅')
            }
        } catch (e) {
            console.log('subscribe 订阅事件发生错误:' + e)
        }
    }
    
    // 取消订阅事件
    static unsubscribe(eventName: string, client: any) {
        try {
            if (!events[eventName]) return;
            events[eventName] = events[eventName].filter(obj => obj !== client);
        } catch (e) {
            console.log('unsubscribe 取消订阅事件发生错误:', e)
        }
    }
    
    //取消订阅事件2
    static unsubscribe2(client: any) {
        try {
            Object.keys(events).forEach(eventName => {
                events[eventName] = events[eventName].filter(obj => obj !== client);
            });
        } catch (e) {
            console.log('unsubscribe2 执行发生错误:' + e)
        }
    }
    
    // 发布事件
    static publish(eventName: string, data: any) {
        try {
            if (!events[eventName]) return;
            console.log('publish 发布事件:', eventName, data)
            events[eventName].forEach((client) => {
                client.send(JSON.stringify({
                    eventName: eventName,
                    className: null,
                    method: null,
                    data: data
                }))
            })
        } catch (e) {
            console.log('publish 发布事件发生错误:' + e)
        }
    }
}

//tag 标识结构
export class Struct {
    fromUser: any
    ws: any
    className: string
    method: string
    
    constructor(from: any, websocket: any, classname: string, methodName: string) {
        this.fromUser = from
        this.ws = websocket
        this.className = classname
        this.method = methodName
    }
}