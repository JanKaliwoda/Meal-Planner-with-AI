FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1

COPY ./requirements.txt /requirements.txt

RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# apk add --update --upgrage --no-cache postgresql-client && \
#     apk add --update --upgrade --no-cache --virtual .tmp \
#     build-base postgresql-dev

# RUN apk update && apk add --no-cache bash postgresql-dev gcc musl-dev

RUN pip install --no-cache-dir "numpy>=1.26,<2.0"
RUN pip install --no-cache-dir -r requirements.txt

# COPY scripts/wait-for-it.sh /wait-for-it.sh
# RUN chmod +x /wait-for-it.sh

# RUN mkdir /app
COPY ./app /app
WORKDIR /app

RUN useradd -m user
USER user

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]