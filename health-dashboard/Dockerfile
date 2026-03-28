ARG BUILD_FROM
FROM $BUILD_FROM

RUN apk add --no-cache nginx net-tools iproute2 wget curl jq

RUN mkdir -p /var/lib/nginx/tmp /var/log/nginx /run/nginx \
    && chown -R nginx:nginx /var/lib/nginx /var/log/nginx /run/nginx \
    && chmod -R 755 /var/lib/nginx /var/log/nginx /run/nginx

COPY nginx.conf /etc/nginx/nginx.conf
COPY build /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html

COPY run.sh /
RUN chmod a+x /run.sh

EXPOSE 8100

CMD ["/run.sh"]
