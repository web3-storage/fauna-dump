FROM openjdk:18-jdk-buster
ADD https://fauna-repo.s3.amazonaws.com/fdm/fdm.zip /usr/local/bin/fdm.zip
RUN cd /usr/local/bin && unzip fdm.zip
WORKDIR /usr/local/bin/fdm-1.14
CMD ["/usr/local/bin/fdm-1.14/fdm"]

# Easiest to run as
# docker build -t fdm .
# docker run -it --rm -v $(pwd)/dump:/dump fdm /bin/bash
# ./fdm -source key=<your fauna key> -dest path=/dump
