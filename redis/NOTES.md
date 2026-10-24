# Redis Backend Project — Quick Notes

These notes follow the project setup in the same order as the PowerShell command history.

## 1. Open the project folder

The first entries were:

```powershell
backend-projects
backend-project
```

These are folder names, not PowerShell commands, so PowerShell cannot run them directly.
Use `cd` to change folders:

```powershell
cd C:\Users\vansh\backend-projects
code .
cd redis
```

- `cd <folder>`: moves into a folder.
- `code .`: opens the current folder (`.`) in VS Code.
- `cd redis`: moves into the Redis project folder.

## 2. Initialize the Node.js project

The first attempt was:

```powershell
pnpm init
```

It failed because PowerShell could not find pnpm. That means pnpm was not installed or was not available through PATH.

Install pnpm globally through npm:

```powershell
npm install -g pnpm
```

After installation, initialize the project:

```powershell
pnpm init
```

`pnpm init` creates `package.json`, which stores project information, dependencies, and scripts.

Useful check:

```powershell
pnpm --version
```

The current project requires pnpm 12.15.0. To install that exact version:

```powershell
npm install -g pnpm@12.15.0
```

## 3. Install TypeScript and Node.js types

```powershell
pnpm install typescript @types/node -D
```

- `typescript`: provides the TypeScript compiler (`tsc`).
- `@types/node`: provides TypeScript types for Node.js features such as `process.env`.
- `-D`: saves packages under `devDependencies` because they are used during development.

## 4. Install Express and its types

```powershell
pnpm install express@4.x
pnpm install @types/express@4.x -D
```

- `express@4.x`: installs Express version 4 as a runtime dependency.
- `@types/express@4.x`: gives TypeScript the Express type definitions.

Runtime packages go in `dependencies`. Development tools and type definitions go in `devDependencies`.

Shorter equivalent commands:

```powershell
pnpm add express@4
pnpm add -D typescript @types/node @types/express@4
```

## 5. Create the TypeScript configuration

The command history contains:

```powershell
tsc --init
```

This creates `tsconfig.json`, which controls TypeScript compilation.
If `tsc` is not recognized globally, use the project-local compiler:

```powershell
pnpm exec tsc --init
```

Important current settings:

```jsonc
"rootDir": "./src",
"outDir": "./dist"
```

- Write TypeScript source code in `src`.
- TypeScript generates JavaScript in `dist`.
- Do not edit generated `dist` files because the next build can overwrite them.

## 6. Build and start the app

The scripts in `package.json` are:

```json
"scripts": {
  "build": "tsc -p .",
  "start": "node dist/index",
  "dev": "tsc-watch --onSuccess \"pnpm start\""
}
```

Run:

```powershell
pnpm build
pnpm start
```

- `pnpm build`: runs `tsc -p .`, reads this folder's `tsconfig.json`, and compiles `src` into `dist`.
- `pnpm start`: runs the compiled `dist/index.js` file with Node.js.
- Build before starting whenever the source has changed.

## 7. Add development watch mode

The next installation command was:

```powershell
pnpm install tsc-watch -D
```

`tsc-watch` watches TypeScript files. When a file changes, it recompiles the project.

The development script is:

```json
"dev": "tsc-watch --onSuccess \"pnpm start\""
```

Run it with:

```powershell
pnpm dev
```

It compiles TypeScript, starts the app after a successful compilation, and recompiles/restarts after saved changes. Stop it with `Ctrl+C`.

The escaped `\"` characters are quotation marks inside the JSON string.

## 8. EBADDEVENGINES error

The original dev script used:

```json
"dev": "tsc-watch --onSuccess \"npm start\""
```

TypeScript compiled successfully, but `npm start` failed because `package.json` declares pnpm as the required package manager.

The corrected script uses:

```json
"dev": "tsc-watch --onSuccess \"pnpm start\""
```

After changing it, stop the old watcher with `Ctrl+C` and run `pnpm dev` again.

## 9. Environment variable and default port

Current code:

```ts
const port = process.env.PORT || 8000;
```

- Uses `PORT` when it exists and is not empty.
- Uses `8000` when `PORT` is `undefined` or an empty string.
- Environment variables are strings.

Explicit number conversion:

```ts
const port = Number(process.env.PORT || 8000);
```

A missing `.env` file does not always mean `PORT` is missing. The terminal or hosting platform can also set it. A `.env` file must be loaded before its values appear in `process.env`.

## 10. `||` versus `??`

- `||` uses the fallback for any falsy value: `false`, `0`, `""`, `NaN`, `null`, or `undefined`.
- `??` uses the fallback only for `null` or `undefined`.

```ts
0 || 10;        // 10
0 ?? 10;        // 0
"" || "hello";  // "hello"
"" ?? "hello";  // ""
```

For the port, `||` is reasonable because an empty port value should fall back to `8000`.

## 11. Current Express server

```ts
import express from "express";

const app = express();
const port = process.env.PORT || 8000;

app.get("/", (req, res) => {
  return res.json({ status: "success" });
});

app.listen(port, () => {
  console.log("server is running on port: ", port);
});
```

- `express()` creates the server application.
- `app.get("/", ...)` handles GET requests to `/`.
- `res.json(...)` returns JSON to the client.
- `app.listen(...)` starts the server on the selected port.
- With the default port, visit `http://localhost:8000/`.

## 12. Why package.json has no comments

`package.json` uses strict JSON, which does not support `//` or `/* ... */` comments. Comments would make it invalid for pnpm, npm, and Node.js tools.

Keep explanations in this notes file. `tsconfig.json` supports JSON with comments, so comments are allowed there.

## Daily commands

While developing:

```powershell
cd C:\Users\vansh\backend-projects\redis
pnpm dev
```

Build and run manually:

```powershell
pnpm build
pnpm start
```

Install everything listed in an existing `package.json`:

```powershell
pnpm install
```
