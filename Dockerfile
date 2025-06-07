FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm install -g prisma
RUN npx prisma generate

CMD ["npm", "run", "dev"]