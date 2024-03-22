FROM registry.suse.com/bci/bci-base:15.5

RUN zypper -n install nginx jq

COPY package/nginx.conf /etc/nginx/nginx.conf

# Copy in plugin files and generate files.txt statically
COPY plugin /home/plugin-server/plugin-contents/plugin
COPY plugin/index.yaml /home/plugin-server/plugin-contents

RUN echo 'pluginserver:x:1000:1000::/home/pluginserver:/bin/bash' >> /etc/passwd && \
    echo 'pluginserver:x:1000:' >> /etc/group && \
    mkdir -p /home/plugin-server && \
    mkdir -p /home/plugin-server/plugin-contents && \
    chown -R pluginserver:pluginserver /etc/nginx/nginx.conf && \
    chown -R pluginserver:pluginserver /home/plugin-server && \
    chown -R pluginserver:pluginserver /var/lib/nginx && \
    chown -R pluginserver:pluginserver /var/log/nginx && \
    touch /run/nginx.pid && \
    chown pluginserver:pluginserver /run/nginx.pid
USER pluginserver

WORKDIR /home/plugin-server/plugin-contents

RUN find plugin -type f | sort > files.txt

ENTRYPOINT ["nginx", "-g", "daemon off;"]
