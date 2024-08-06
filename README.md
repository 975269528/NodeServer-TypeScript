# Node服务端 - typescript版

注意 请把 `.env` 前缀的文件放在编译后的文件根目录

运行项目前,先安装TypeScript

    npm install -g typescript

tsconfig.json 配置如下

```javascript
{
    "compilerOptions": {
        "target": "es2016",
        "module": "ESNext",
        "rootDir": "./",
        "moduleResolution": "node",
        "outDir": "./dist",
        "esModuleInterop": true,
        "forceConsistentCasingInFileNames": true,
        "strict": true,
        "skipLibCheck": true
    }
}
```

编译TS到JS的命令, 编译后的文件在 `dist` 目录中

    npx tsc

