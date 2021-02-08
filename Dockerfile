FROM node:14-alpine

ARG ENVIRONMENT=development

ENV NODE_ENV ENVIRONMENT
ENV IS_CONTAINER_ENV true

WORKDIR /usr/src/app

COPY package*.json ./

RUN apk update
RUN apk add curl python --no-cache --virtual build-dependencies build-base gcc

RUN npm ci --only=production

COPY . .

EXPOSE 8080

CMD [ "npm", "run", "startBuilt" ]
