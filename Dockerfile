FROM ubuntu

RUN apt update -y && apt install -y ffmpeg

COPY ./out /root/out

EXPOSE 8080

WORKDIR /root

CMD "/root/out"
