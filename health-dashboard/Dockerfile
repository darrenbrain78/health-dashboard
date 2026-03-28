ARG BUILD_FROM
FROM $BUILD_FROM

RUN apk add --no-cache nginx net-tools iproute2 wget curl nodejs npm jq

RUN mkdir -p /var/lib/nginx/tmp /var/log/nginx /run/nginx \
    && chown -R nginx:nginx /var/lib/nginx /var/log/nginx /run/nginx \
    && chmod -R 755 /var/lib/nginx /var/log/nginx /run/nginx

COPY nginx.conf /etc/nginx/nginx.conf
COPY build /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html

# Chat server
COPY chat-server /opt/chat-server
RUN cd /opt/chat-server && npm install --omit=dev

COPY run.sh /
RUN chmod a+x /run.sh

EXPOSE 8100

CMD ["/run.sh"]
