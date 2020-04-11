FROM node:12-alpine

ARG ENVIRONMENT=production
ARG SSH_PRIVATE_KEY

ENV NODE_ENV ENVIRONMENT
ENV IS_CONTAINER_ENV true

RUN apk update
RUN apk add --no-cache openssh-client git
RUN apk add curl python --no-cache --virtual build-dependencies build-base gcc

RUN mkdir /root/.ssh/
RUN chmod 0700 /root/.ssh
RUN ssh-keyscan github.com >> /root/.ssh/known_hosts
RUN echo "${SSH_PRIVATE_KEY}" > /root/.ssh/id_rsa
RUN chmod 600 /root/.ssh/id_rsa

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm prune --production
RUN rm -rf /root/.ssh/

EXPOSE 8080

CMD [ "npm", "run", "startApp" ]
