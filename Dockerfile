FROM node:10-alpine

RUN mkdir /src
WORKDIR /src

RUN apk update && apk upgrade

COPY package.json /src/
COPY yarn.lock /src/
RUN yarn install

COPY . /src
RUN yarn build

EXPOSE 80
ENTRYPOINT ["yarn"]
CMD ["start"]
