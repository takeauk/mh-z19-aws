FROM python:latest

RUN apt update

RUN apt-get install curl
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash
RUN apt-get install -y nodejs

RUN pip3 install awscli --upgrade \
    && npm install -g typescript

RUN npm install -g aws-cdk@1.131.0
