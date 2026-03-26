FROM node:24-alpine

WORKDIR /workspace/frontend

COPY package*.json ./
RUN npm install -g @angular/cli
RUN npm install


COPY . .

EXPOSE 4200

CMD ["npm", "start"]
