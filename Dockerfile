FROM node:12

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

ENTRYPOINT ["npm", "run", "start"]
CMD []
