FROM node:14 as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build


FROM node:14-slim
WORKDIR /travel-app-backend
COPY --from=builder /app ./
EXPOSE 3002
ENV mode development
CMD [ "npm","run","start:prod" ]