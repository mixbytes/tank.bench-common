FROM node:12

WORKDIR /tool

RUN cd /tool

COPY . .

RUN npm install

RUN npm run build

ENTRYPOINT ["npm", "run", "start", "--"]
CMD []
