import {GameManager, Struct} from "../core/GameManager";

export default class ServerEvent {
    constructor() {
    }
    
    //添加订阅事件
    addServerEvent(tag: Struct, eventName: any): void {
        let name = eventName.eventName
        console.log(tag.fromUser, " addServerEvent订阅消息事件:" + name)
        GameManager.subscribe(name, tag.ws)
    }
    
    //移除订阅事件
    removeServerEvent(tag: Struct, eventName: any) {
        let name = eventName.eventName
        console.log(tag.fromUser, " removeServerEvent取消订阅消息事件:" + name)
        GameManager.unsubscribe(name, tag.ws)
    }
}