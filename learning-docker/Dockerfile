FROM node:latest

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY index.js index.js

# COPY src/ src/
# COPY . .            //-> sab kuch copy krlo but jo .dockerignore mai hai wo nahi jayega

RUN npm install


CMD ["node", "index.js"]