import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';

class ServerEvent {
  constructor() {
  }
  //添加订阅事件
  addServerEvent(tag, eventName) {
    let name = eventName.eventName;
    console.log(tag.fromUser, " addServerEvent\u8BA2\u9605\u6D88\u606F\u4E8B\u4EF6:" + name);
    GameManager.subscribe(name, tag.ws);
  }
  //移除订阅事件
  removeServerEvent(tag, eventName) {
    let name = eventName.eventName;
    console.log(tag.fromUser, " removeServerEvent\u53D6\u6D88\u8BA2\u9605\u6D88\u606F\u4E8B\u4EF6:" + name);
    GameManager.unsubscribe(name, tag.ws);
  }
}

class User {
  constructor() {
  }
  login(tag, data) {
    console.log("login\u5BA2\u6237\u7AEF\u6D88\u606F:" + data);
    GameManager.send(tag, "\u4F60\u597D,\u6211\u662F\u670D\u52A1\u5668\u8FD4\u56DE\u7684\u6D88\u606F");
    GameManager.publish("test", "\u8FD9\u4E9B\u8BA2\u9605\u4E8B\u4EF6\u63A8\u9001\u7684\u5185\u5BB9");
  }
}

const Models = {
  ServerEvent: new ServerEvent(),
  User: new User()
};

let eventLoop = false;
let eventFunc = [];
let classMap = Models;
let Server;
let loopResult;
let events = {};
class GameManager {
  //启动服务器
  static run() {
    let port = parseInt(process.env.WEBSOCKET_PORT || "");
    if (!isNaN(port)) {
      Server = new WebSocketServer({ port });
      console.log("\u7AEF\u53E3\u89E3\u6790\u4E3A:", port, "\u670D\u52A1\u5668\u5DF2\u542F\u52A8");
    } else {
      console.log("WebSocketServer \u7AEF\u53E3\u8BBE\u7F6E\u9519\u8BEF: ", process.env.WEBSOCKET_PORT);
      return;
    }
    Server.on("connection", (ws, req) => {
      const clientAddress = req.socket.remoteAddress;
      console.log("\u7528\u6237[" + clientAddress + "] \u8FDB\u5165\u8FDE\u63A5");
      ws.on("message", (msg) => {
        try {
          console.log("message\u6536\u5230\u7684\u539F\u59CB\u6D88\u606F", msg.toString());
          let { className, method, data } = JSON.parse(msg.toString());
          let tag = new Struct(clientAddress, ws, className, method);
          this.call(tag, className, method, data);
        } catch (e) {
          console.log(e);
        }
      });
      ws.on("close", () => {
        this.unsubscribe2(ws);
        console.log("close\u7528\u6237\u65AD\u5F00\u8FDE\u63A5" + clientAddress);
      });
      ws.on("error", (err) => {
        console.log("error\u7528\u6237\u5F02\u5E38\u65AD\u5F00" + clientAddress);
        console.log(err);
      });
    });
  }
  //调用类方法且传递参数
  static call(tag, className, method, data) {
    try {
      if (typeof classMap[className][method] === "function") {
        classMap[className][method](tag, data);
      } else {
        console.log("\u8C03\u7528\u7C7B\u65B9\u6CD5\u5931\u8D25:", className, method);
      }
    } catch (e) {
      console.log("call\u53D1\u751F\u9519\u8BEF:" + e);
    }
  }
  //发送消息到客户端
  static send(tag, data) {
    try {
      tag.ws.send(JSON.stringify({
        eventName: 0,
        className: tag.className,
        method: tag.method,
        data
      }));
    } catch (e) {
      console.log(e);
    }
  }
  //开启事件循环 delay = 间隔毫秒
  static openEventLoop(delay) {
    if (!eventLoop) {
      delay = delay < 16 ? 16 : delay;
      eventLoop = true;
      loopResult = setInterval(() => {
        eventFunc.forEach((func) => {
          func();
        });
      }, delay);
    }
  }
  //关闭事件循环
  static closeEventLoop() {
    if (eventLoop) {
      clearInterval(loopResult);
      eventLoop = false;
    }
  }
  //添加定时循环函数
  static addEventLoopFunc(handler) {
    if (!eventFunc.includes(handler)) {
      eventFunc.push(handler);
    }
  }
  //删除定时循环函数
  static removeEventLoopFunc(handler) {
    let index = eventFunc.indexOf(handler);
    if (index !== -1) {
      eventFunc.splice(index, 1);
    }
  }
  // 订阅事件
  static subscribe(eventName, client) {
    try {
      if (!events[eventName]) {
        events[eventName] = [];
      }
      if (!events[eventName].includes(client)) {
        events[eventName].push(client);
      } else {
        console.log("subscribe \u5BA2\u6237\u7AEF\u5DF2\u5B58\u5728,\u4E0D\u53EF\u91CD\u590D\u8BA2\u9605");
      }
    } catch (e) {
      console.log("subscribe \u8BA2\u9605\u4E8B\u4EF6\u53D1\u751F\u9519\u8BEF:" + e);
    }
  }
  // 取消订阅事件
  static unsubscribe(eventName, client) {
    try {
      if (!events[eventName]) return;
      events[eventName] = events[eventName].filter((obj) => obj !== client);
    } catch (e) {
      console.log("unsubscribe \u53D6\u6D88\u8BA2\u9605\u4E8B\u4EF6\u53D1\u751F\u9519\u8BEF:", e);
    }
  }
  //取消订阅事件2
  static unsubscribe2(client) {
    try {
      Object.keys(events).forEach((eventName) => {
        events[eventName] = events[eventName].filter((obj) => obj !== client);
      });
    } catch (e) {
      console.log("unsubscribe2 \u6267\u884C\u53D1\u751F\u9519\u8BEF:" + e);
    }
  }
  // 发布事件
  static publish(eventName, data) {
    try {
      if (!events[eventName]) return;
      console.log("publish \u53D1\u5E03\u4E8B\u4EF6:", eventName, data);
      events[eventName].forEach((client) => {
        client.send(JSON.stringify({
          eventName,
          className: null,
          method: null,
          data
        }));
      });
    } catch (e) {
      console.log("publish \u53D1\u5E03\u4E8B\u4EF6\u53D1\u751F\u9519\u8BEF:" + e);
    }
  }
}
class Struct {
  fromUser;
  ws;
  className;
  method;
  constructor(from, websocket, classname, methodName) {
    this.fromUser = from;
    this.ws = websocket;
    this.className = classname;
    this.method = methodName;
  }
}

dotenv.config();
GameManager.run();
