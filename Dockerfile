FROM python:latest

RUN apt update \
    && apt install -y nodejs \
    npm \
    && apt clean

RUN pip3 install awscli --upgrade \
    && npm install -g aws-cdk \
    && npm install -g typescript
