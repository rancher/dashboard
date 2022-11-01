FROM node:14-alpine as builder

RUN apk --update add git less openssh bash && \
    rm -rf /var/lib/apt/lists/* && \
    rm /var/cache/apk/*

RUN mkdir -p /src/dashboard
WORKDIR /src/dashboard
COPY . /src/dashboard/

RUN ./scripts/build-hosted

FROM nginx:1.21.1-alpine

RUN rm -rf /usr/share/nginx/html/*
RUN mkdir /usr/share/nginx/html/dashboard
COPY --from=builder /src/dashboard/dist /usr/share/nginx/html/dashboard
COPY image-scripts/nginx.conf.template /etc/nginx/conf.d/default.conf.template
RUN  rm /etc/nginx/conf.d/default.conf -rf
COPY image-scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
VOLUME /etc/nginx/ssl
ENV HOST releases.rancher.com
ENV ALLOW_ORIGIN *

RUN ln -s `find /usr/share/nginx/html/ -maxdepth 3 -type f -name "index.html" | head -n 1` /usr/share/nginx/html/index.html

CMD [ "sh", "-c", "/entrypoint.sh" ]
