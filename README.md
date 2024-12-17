# FullStack Real-time Chatbot Project

## 1. 🚀 Overview
This repository is a full-stack application template designed for hobbyists and developers to practice and explore full-stack chatbot application. 

It combines a modern **Next.js** frontend with a robust **FastAPI** backend, integrating **LangChain** and LLMs API for AI-powered features. The architecture includes a **PostgreSQL** server, **SSO** authentication with **Google gmail** using **NextAuth**, and support for real-time **Server-Sent Events (SSE)**, making it an excellent starting point for learning how to build, connect, and deploy AI-driven applications!

The demo in this repository also utilize `Typhoon` free openapi! You can register and try it out for free as well ...hooerey 🎊.

## 2. (Simple) System Architecture

![fullstack-webapp](/docs/chatbot-fullstack.svg)

In this architecture, there are 2 main components as follow:

1. **Frontend service** powered by `Next.js`
3. **Backend service** powered by `FastAPI` (and `Next.js` as proxy)

With this setup, we have no need to setup security layer at `Backend LLM api server`! Since this *api server* will be hosted on private network and will be requested only through `proxy server`.

The communication between `Frontend browser` to `Backend proxy server` is also secured by default using *secret* from `Next.js` which also implements `CORS` for security.

Lastly, there is also a `NextAuth` middleware to prevent all requests to access `Frontend webserver` and `Backend proxy server` unless authenticated/authorized by SSO with GCP.

### Backend Stack
- Server-Sent Events (SSE) support for streaming LLM tokens
- FastAPI web framework
- SQLAlchemy with PostgreSQL database
- LangChain + OpenAI integration
- Alembic for database migrations
- Uvicorn ASGI server

### Frontend Stack
- Server-Sent Events (SSE) support for streaming LLM tokens
- Next.js React framework
- SSO Integration with Google
- Zustand state management

## 3. Usage

Please install these required tools first for local development:

1. [uv](https://docs.astral.sh/uv/): Super fast python env/deps management
2. [pre-commit hook](https://pre-commit.com/): For code quality checking even before commiting to git. You can check the current setup at `.pre-commit-config.yaml`
3. [nvm](https://github.com/nvm-sh/nvm): For node version management
4. [nerdctl](https://github.com/containerd/nerdctl): Opensource dropin replacement for `docker` (this is just my preference though 🤣).

### Full-stack Setup locally
1. Run `nerdctl compose up --buld frontend-webapp`  
    > You can also use `docker` as well ;)
2. Access the frontend webapp at `http://localhost:3000`

> Note that backend api server cannot be accessed by default on `nerdctl compose` setup.
> You need to expose the port in `docker-compose.yaml` manually.

### Setting up each stack separately

#### Backend Setup
1. Navigate to the backend directory:
```sh
cd typhoon-be
```

2. Install dependencies:

```sh
cd typhoon-be
uv sync --frozen
```

3. Set up environment variables:
```sh
DATABASE_URL=<async-database-url>
ALEMBIC_DATABASE_URL=<sync-database-url>
LLM_ENDPOINT=<llm-endpoint>
API_KEY=<your-api-key>  # API key for accessing typhoon model
```

4. Run migration
```sh
uv run alembic upgrade head
```

5. Run api server
```sh
uv run fastapi run src/app.py
```

#### Frontend Setup
1. Navigate to the frontend directory:
```sh
cd typhoon-fe
```

2. Install dependencies:
```sh
npm install
```

3. Set up environment variables:
```sh
NEXTAUTH_SECRET=
LLM_BACKEND_ENDPOINT=http://localhost:3000
# Google IdP credentials for SSOing with google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

4. Start the development server:
```sh
npm run dev
```

Access the application at [http://localhost:3000](http://localhost:3000)
