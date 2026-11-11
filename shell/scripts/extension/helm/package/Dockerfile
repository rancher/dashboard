FROM registry.suse.com/bci/bci-base:15.7

RUN zypper -n install nginx jq

RUN echo 'pluginserver:x:1000:1000::/home/pluginserver:/bin/bash' >> /etc/passwd && \
    echo 'pluginserver:x:1000:' >> /etc/group && \
    mkdir -p /home/plugin-server/plugin-contents && \
    chown -R pluginserver:pluginserver /home/plugin-server && \
    chown -R pluginserver:pluginserver /var/lib/nginx && \
    chown -R pluginserver:pluginserver /var/log/nginx && \
    touch /run/nginx.pid && \
    chown pluginserver:pluginserver /run/nginx.pid

# Ownership is set at copy time, and the user is created above so the name resolves.
# A `chown -R` after the copy would write a second, full copy of the payload into the image.
COPY --chown=pluginserver:pluginserver package/nginx.conf /etc/nginx/nginx.conf

# Copy in plugin files and generate files.txt statically
COPY --chown=pluginserver:pluginserver plugin /home/plugin-server/plugin-contents/plugin
COPY --chown=pluginserver:pluginserver plugin/index.yaml /home/plugin-server/plugin-contents

USER pluginserver

WORKDIR /home/plugin-server/plugin-contents

RUN find plugin -type f | sort > files.txt

ENTRYPOINT ["nginx", "-g", "daemon off;"]
