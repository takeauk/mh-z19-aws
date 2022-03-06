FROM python:latest

WORKDIR /workspace

RUN apt update

RUN apt-get install curl
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash
RUN apt-get install -y nodejs

RUN pip3 install awscli --upgrade \
    && npm install -g typescript

RUN npm install -g aws-cdk

COPY package*.json ./

RUN npm install

RUN mkdir -p handlers/packages

COPY handlers/requirements.txt ./handlers/
RUN pip3 install -r handlers/requirements.txt -t handlers/packages/

COPY . .
