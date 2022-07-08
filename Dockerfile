FROM node:14-alpine

RUN mkdir /src
WORKDIR /src

RUN apk update && apk upgrade

COPY package.json /src/
COPY yarn.lock /src/
RUN yarn --pure-lockfile install

COPY . /src
RUN yarn build

EXPOSE 80
ENTRYPOINT ["yarn"]
CMD ["start"]
