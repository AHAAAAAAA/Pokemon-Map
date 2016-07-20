FROM python:2.7-alpine

# ca-certificates is needed because without it, pip fails to install packages due to a certificate failure
# build-base contains gcc, which is needed during the installation of the pycryptodomex pip package
RUN apk add --update ca-certificates build-base

# default port the app runs on
EXPOSE 5000

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENTRYPOINT ["python", "./example.py"]

COPY requirements.txt /usr/src/app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /usr/src/app
