FROM ubuntu:25.04 AS backend-image
COPY --from=ghcr.io/astral-sh/uv:0.5.9 /uv /uvx /bin/

WORKDIR /app

COPY typhoon-be/pyproject.toml typhoon-be/uv.lock typhoon-be/.python-version ./
RUN uv sync --frozen

FROM backend-image AS backend-migration
WORKDIR /app
COPY typhoon-be/alembic.ini ./
COPY typhoon-be/alembic/ ./alembic/
COPY typhoon-be/src/ ./src/

ENTRYPOINT [ "uv", "run", "alembic", "upgrade", "head" ]

FROM backend-image AS backend-webapp
WORKDIR /app
COPY typhoon-be/src/ ./src/

ENTRYPOINT [ "uv", "run", "fastapi", "run", "src/app.py" ]

FROM node:22-bullseye AS frontend-webapp

WORKDIR /app
COPY typhoon-fe/. /app/

RUN npm install && npm run build
ENTRYPOINT ["npm", "run", "start"]
