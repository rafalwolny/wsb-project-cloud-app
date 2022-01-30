FROM node:16

WORKDIR /app

COPY frontend/node_modules node_modules
COPY frontend/public public
COPY frontend/src src
COPY frontend/package.json package.json
COPY frontend/tsconfig.json tsconfig.json

CMD bash -c "yarn start"