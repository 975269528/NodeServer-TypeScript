import { fileURLToPath } from 'url';
import path, {resolve} from "path";
import { readdirSync, statSync, writeFileSync } from 'fs';
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { builtinModules } from "module";
import esbuild from "rollup-plugin-esbuild";
import { defineConfig } from "rollup";
import { dependencies } from "../package.json";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function autoLoader() {
    let apiPath = resolve(__dirname, "../src/api");
    let loaderPath = resolve(__dirname, "../src/core/Models.ts");
    let dirs = [apiPath];
    let files: string[] = [];
    for (let i = 0; i < dirs.length; i++) {
        let _temp = readdirSync(dirs[i]);
        for (let j = 0; j < _temp.length; j++) {
            if (['.DS_Store', '.gitkeep', 'README.md'].includes(_temp[j])) continue;
            let _path = dirs[i] + "/" + _temp[j];
            if (statSync(_path).isFile()) {
                let _f = _path.split(apiPath)[1];
                files.push(_f.replace(/\/([\s\S]*?)\.ts/g, '$1'));
            }
            else dirs.push(_path);
        }
    }
    let text = files.map(item => {
        let _f = item.split('/');
        return `import ${_f.join('_')} from "../api/${item}";`
    }).join('\n');

    text += `\n\nconst Models = {\n` + files.map(item => {
        let _f = item.split('/');
        return `    ${_f.join('_')}: new ${_f.join('_')}()`
    }).join(',\n') + `\n}\n\nexport default Models;`;

    writeFileSync(loaderPath, `${text}`, {
        encoding: "utf-8"
    })

    return {
        name: "autoComponentType"
    }
}


export default (env = "production") => {
  return defineConfig({
    input: path.join(__dirname, "..", "src", "app.ts"),
    output: {
      dir: path.join(
        __dirname,
        "..",
        "dist"
      ),
      format: "esm",
      name: "MainProcess",
      sourcemap: false,
    },
    plugins: [
        autoLoader(),
      // 提供路径和读取别名
      nodeResolve({
        preferBuiltins: true,
        browser: false,
        extensions: [".mjs", ".ts", ".js", ".json", ".node"],
      }),
      esbuild({
        // All options are optional
        include: /\.[jt]s?$/, // default, inferred from `loaders` option
        exclude: /node_modules/, // default
        // watch: process.argv.includes('--watch'), // rollup 中有配置
        sourceMap: env != "production", // default
        minify: env === "production",
        target: "esnext", // default, or 'es20XX', 'esnext'
        // Like @rollup/plugin-replace
        define: {
          __VERSION__: '"x.y.z"',
        },
        // Add extra loaders
        loaders: {
          // Add .json files support
          // require @rollup/plugin-commonjs
          ".json": "json",
          // Enable JSX in .js files too
          ".js": "jsx",
        },
      })
    ],
    external: [...builtinModules, ...Object.keys(dependencies), "electron"],
  });
};
