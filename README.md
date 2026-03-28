# PurpleOps Arena

> AI-powered purple team cyber range platform — Red + Blue + AI in one unified platform.

![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.11+-green)
![React](https://img.shields.io/badge/react-18+-blue)

---

## Features
- Attack Simulation
- Detection System
- AI Analysis

## Setup
1. Clone repo
2. Install dependencies
3. Run project

## Author
Sahil Bagde

## Overview

PurpleOps Arena is a full-stack cybersecurity platform that integrates offensive attack simulation, defensive detection engineering, and AI-powered analysis into a single guided workflow.

**Core capabilities:**
- Launch MITRE ATT&CK-mapped attack scenarios in an isolated lab
- Collect and normalise telemetry from Sysmon, Wazuh, Zeek, and Suricata
- Evaluate Sigma detection rules against live attack events
- Get AI-powered incident analysis (beginner and analyst modes) via Claude
- View coverage gaps on an interactive ATT&CK heatmap
- Earn XP and level up through the gamification system

---

## 📸 Screenshots

<img width="1184" height="553" alt="Screenshot 2026-03-28 163131" src="https://github.com/user-attachments/assets/b1a32f93-1ab8-4c35-8fdb-4e0554269058" />

<img width="1916" height="994" alt="Screenshot 2026-03-28 163212" src="https://github.com/user-attachments/assets/d7affdb6-9cb1-40db-ad31-fb655c6c9cf8" />

<img width="1919" height="993" alt="Screenshot 2026-03-28 163234" src="https://github.com/user-attachments/assets/9e4aad84-949e-431a-a452-a50372e7e8e2" />

<img width="1919" height="988" alt="Screenshot 2026-03-28 163303" src="https://github.com/user-attachments/assets/64f14167-ca85-405c-b009-c9576bfde110" />

<img width="1919" height="992" alt="Screenshot 2026-03-28 163338" src="https://github.com/user-attachments/assets/718d5e76-3a99-4a9f-9a3c-6a52d207d1b7" />



### Prerequisites

| Tool | Version |
|------|---------|
| Docker + Docker Compose | 24+ |
| Node.js | 20+ |
| Python | 3.11+ |
| Git | any |

### 1. Clone and configure

```bash
git clone https://github.com/yourname/purpleops-arena.git
cd purpleops-arena

# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env and add your ANTHROPIC_API_KEY
```

### 2. Start infrastructure

```bash
cd infra
docker compose up -d postgres redis
```

### 3. Start the backend

```bash
cd backend
pip install -r requirements.txt
python seed.py          # Populate demo data
uvicorn app.main:app --reload --port 8000
```

### 4. Start Celery worker (new terminal)

```bash
cd backend
celery -A app.tasks.celery_app worker --loglevel=info
```

### 5. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** and sign in with:
- Email: `analyst@demo.com`
- Password: `password123`

---

## Using Docker Compose (all-in-one)

```bash
# Set your Anthropic API key
export ANTHROPIC_API_KEY=sk-ant-...

cd infra
docker compose up --build
```

All services start automatically. Frontend at port 3000, API at 8000.

---

## Project structure

```
purpleops-arena/
├── frontend/          React + Tailwind SPA
│   └── src/
│       ├── pages/     Route-level screens (Dashboard, Scenarios, AI, etc.)
│       ├── components/ Reusable UI components
│       ├── store/     Zustand state management
│       ├── api/       Axios API client + endpoint wrappers
│       └── hooks/     useWebSocket, custom hooks
│
├── backend/           FastAPI Python API
│   ├── app/
│   │   ├── api/v1/    REST routers (auth, scenarios, AI, reports…)
│   │   ├── models/    SQLAlchemy ORM models
│   │   ├── services/  Business logic (gamification, AI analyst)
│   │   ├── tasks/     Celery async tasks
│   │   └── integrations/ Caldera, threat intel
│   └── rules/         Sigma detection rules (YAML)
│
└── infra/             Docker Compose, Nginx, lab network scripts
```

---

## API reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Authenticate, receive JWT |
| POST | `/api/v1/auth/register` | Create account |
| GET  | `/api/v1/scenarios` | List attack scenarios |
| POST | `/api/v1/scenarios/{id}/run` | Launch scenario |
| GET  | `/api/v1/scenarios/runs/{run_id}` | Poll run status |
| GET  | `/api/v1/detections` | List detections |
| GET  | `/api/v1/detections/rules` | List Sigma rules |
| PUT  | `/api/v1/detections/rules/{id}` | Enable/disable rule |
| GET  | `/api/v1/incidents` | List incidents |
| GET  | `/api/v1/incidents/{id}/timeline` | Full attack timeline |
| POST | `/api/v1/ai/analyze` | AI incident analysis |
| POST | `/api/v1/ai/chat` | Streaming AI copilot chat |
| POST | `/api/v1/ai/rca` | Root cause analysis |
| GET  | `/api/v1/reports/scorecard` | Detection scorecard |
| GET  | `/api/v1/reports/attack-heatmap` | ATT&CK coverage data |
| WS   | `/ws/{run_id}` | Real-time event stream |

Full interactive docs: **http://localhost:8000/docs**

---

## AI features

PurpleOps uses the Anthropic Claude API for:

| Feature | Description |
|---------|-------------|
| Beginner analysis | Plain-language incident explanation |
| Analyst analysis | Technical ATT&CK-mapped deep dive |
| Root cause analysis | Why a detection failed + fix recommendations |
| Copilot chat | Interactive streaming Q&A about any alert or log |

Add your `ANTHROPIC_API_KEY` to `backend/.env` to enable all AI features.

---

## Lab isolation

All attack simulations run inside an isolated Docker network (`purpleops-lab`):

- No external internet access from lab nodes (iptables egress BLOCK)
- Sysmon EID 1, 3, 7, 10, 11, 12, 13 enabled on Windows targets
- Network traffic mirrored to Zeek + Suricata for analysis
- Hosts can be isolated (network removed) via the Lab Assets page

Run `infra/lab/network-policy.sh` to apply lab network isolation rules.

---

## Development roadmap

| Phase | Scope | Timeline |
|-------|-------|----------|
| 1 – MVP | Auth, 3 scenarios, basic telemetry, AI summary | Weeks 1–4 |
| 2 – Core | WebSocket, rule editor, RCA, Celery tasks | Weeks 5–8 |
| 3 – Advanced | Caldera, gamification, response playbooks | Weeks 9–12 |
| 4 – Polish | Tests, docs, demo mode, deployment | Weeks 13–16 |

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Vite, Zustand |
| Backend | FastAPI, SQLAlchemy (async), Alembic |
| Database | PostgreSQL 16 |
| Queue | Redis + Celery |
| Telemetry | Sysmon, Wazuh, Zeek, Suricata |
| Detection | Sigma rules + custom Python |
| Attack sim | Atomic Red Team, MITRE Caldera |
| AI | Anthropic Claude (claude-sonnet-4-20250514) |
| Proxy | Nginx |

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push and open a PR

---

## License

MIT — free to use for educational and portfolio purposes.
