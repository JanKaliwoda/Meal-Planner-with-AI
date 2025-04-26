FROM python:3.13.3-alpine

ENV PYTHONUNBUFFERED=1

COPY ./requirements.txt /requirements.txt

RUN apk add bash
COPY scripts/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

RUN apk update && apk add postgresql-dev gcc musl-dev
RUN pip install -r requirements.txt

RUN mkdir /app
WORKDIR /app
COPY ./app /app

RUN adduser -D user
USER user