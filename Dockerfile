FROM python:3.13.3-alpine

ENV PYTHONUNBUFFERED=1

RUN apk update && apk add --no-cache bash postgresql-dev gcc musl-dev

COPY ./requirements.txt /requirements.txt
RUN pip install -r requirements.txt

COPY scripts/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

RUN mkdir /app
WORKDIR /app
COPY ./app /app

RUN adduser -D user
USER user