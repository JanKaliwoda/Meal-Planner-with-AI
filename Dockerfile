FROM python:3.13.3-alpine

ENV PYTHONUNBUFFERED=1

COPY ./requirements.txt /requirements.txt

RUN apk add --update --upgrage --no-cache postgresql-client && \
    apk add --update --upgrade --no-cache --virtual .tmp \
        build-base postgresql-dev

# RUN apk update && apk add --no-cache bash postgresql-dev gcc musl-dev

RUN pip install -r requirements.txt && apk del .tmp

# COPY scripts/wait-for-it.sh /wait-for-it.sh
# RUN chmod +x /wait-for-it.sh

# RUN mkdir /app
COPY ./app /app
WORKDIR /app

RUN adduser -D user
USER user

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]