FROM node:lts-alpine

WORKDIR /usr/src/app

COPY . /usr/src/app

RUN yarn install

RUN yarn run build

CMD ["yarn", "run", "start:prod"]
