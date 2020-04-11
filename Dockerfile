FROM node:12-alpine

ARG SSH_PRIVATE_KEY

ENV NODE_ENV production

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

RUN npm ci --only=production
RUN rm -rf /root/.ssh/

COPY . .

EXPOSE 8080

CMD [ "npm", "run", "startApp" ]
