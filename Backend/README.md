# Synapse — Greenwashing Detection in ESG Reports through Neurosymbolic AI and Counterfactual Reasoning

Synapse is a backend system that evaluates ESG (Environmental, Social, Governance) claims made by
companies and flags potential **greenwashing**. It combines:

- **Retrieval-Augmented Generation (RAG)** over a corpus of company sustainability/annual reports and
  external news sources, split into *supportive* and *counterfactual* evidence,
- an **OWL ontology** (reasoned over with the HermiT reasoner via `owlready2`) that encodes greenwashing
  concepts, relationships and SWRL rules — the **neurosymbolic** part of the pipeline, and
- a **local LLM** (via Ollama) that is prompted with the retrieved evidence and the ontology's inferred
  knowledge to produce a structured judgment: whether a claim is supported, contradicted, or ambiguous,
  along with citations back to the source documents.

The result is a claim-checking API that a frontend can call with `{company, topic}` and get back a
greenwashing verdict, a reasoned explanation, and the underlying evidence (company reports, supportive
sources, counterfactual/contradicting sources).

## Project structure

```
Backend/
├── app/                    # FastAPI application
│   ├── main.py              # app entrypoint — app.main:app
│   ├── core/                 # settings (pydantic-settings) + Supabase JWT auth
│   ├── db/                   # Supabase admin client + async SQLAlchemy session
│   ├── models/, schemas/     # Pydantic request/response + DB-facing models
│   └── routers/               # health, organizations, analyze
├── synapse_core/            # RAG + ontology + LLM pipeline used by /analyze
│   ├── pipeline.py            # evaluate_claim() — orchestrates the steps below
│   ├── retrieval.py            # FAISS similarity search (company / counterfactual / supportive)
│   ├── ontologyInfo.py          # loads ontology.owl, runs HermiT reasoner, serializes info for the LLM
│   ├── llm.py                    # ChatOllama model config
│   ├── prompt.py                  # system prompt, guardrails, examples, prompt template
│   └── build_vectorstore.py        # one-off script to (re)build faiss_index/
├── DataPreprocessing/        # dataset cleaning, ESG topic extraction/categorization
├── Evaluation/                # retrieval/prompt evaluation, test-set generation, ROUGE
├── faiss_index/                # prebuilt FAISS vector store (index.faiss, index.pkl)
├── ontology.owl                 # greenwashing OWL ontology (authored in Protégé)
└── requirements.txt
```

## Setup

### 1. Environment variables

Create/edit `.env` in `Backend/`:

```env
SUPABASE_URL=<your supabase project url>
SUPABASE_SECRET_KEY=<supabase service_role secret key>
SUPABASE_DB_URL=postgresql://<user>:<password>@<host>:6543/postgres
CORS_ORIGINS=["http://localhost:3000"]
```

`SUPABASE_DB_URL` is only required by the `/organizations` routes (async SQLAlchemy session) — `/analyze`
does not touch it. `SUPABASE_URL`/`SUPABASE_SECRET_KEY` are required at import time for every route,
since `/analyze` and `/organizations` both verify the caller's Supabase JWT.

### 2. Python virtual environment

Use Python 3.11 (matches the pinned dependency set — `torch`/`owlready2`/`langchain-*` versions in
`requirements.txt` were resolved against it).

```bash
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

> If you also have conda active, make sure the venv's `bin/` wins over conda's `base` env in `PATH`
> (`conda deactivate` before `source venv/bin/activate`, then confirm with `which uvicorn`) — otherwise
> uvicorn will silently run against conda's site-packages instead of the venv's.

### 3. Local LLM (Ollama)

```bash
ollama serve                 # if not already running
ollama pull mistral:7b       # model configured in synapse_core/llm.py
```

### 4. Vector store

`faiss_index/` is already built and committed. To rebuild it from the processed dataset instead:

```bash
cd synapse_core
python build_vectorstore.py
```

> `build_vectorstore.py` resolves its dataset path (`../DataPreprocessing/...`) and writes
> `faiss_index/` relative to **its own directory**, so it must be run from `synapse_core/`. That would
> produce `synapse_core/faiss_index/`, whereas `synapse_core/retrieval.py` loads `faiss_index/` relative
> to the **process's working directory** (i.e. `Backend/faiss_index/`, since the API is run from
> `Backend/`). If you rebuild the index, move/copy the resulting folder to `Backend/faiss_index/` (or
> update the script) before starting the API.

### 5. Run the API

```bash
cd Backend
uvicorn app.main:app --reload
```

Server runs at `http://127.0.0.1:8000` (interactive docs at `/docs`). Must be started from `Backend/` —
`ontology.owl` and `faiss_index/` are loaded via relative paths.

## API details

All routes except `/health` require Supabase authentication:
`Authorization: Bearer <supabase-jwt>`. The token is verified against the project's JWKS
(`SUPABASE_URL/auth/v1/.well-known/jwks.json`), algorithms `ES256`/`RS256`, audience `authenticated`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Liveness check. Returns `{"status": "ok"}`. |
| POST | `/organizations` | No¹ | Creates an organization record right after Supabase sign-up. |
| GET | `/organizations/me?user_id=...` | No¹ | Fetches the organization tied to a user (used to poll verification status). |
| POST | `/analyze` | Yes | Runs the greenwashing-detection pipeline for a `{company, topic}` claim. |

¹ Not currently gated by `get_current_user`, but uses the Supabase `service_role` key server-side.

### `POST /analyze`

**Request body**

| Field | Type | Description |
|---|---|---|
| `company` | string | Company name to evaluate (matched case-insensitively against document metadata). |
| `topic` | string | The ESG claim / topic to check, e.g. `"carbon emissions reduction"`. |

**Response body** (`AnalyzeResponse`)

| Field | Type | Description |
|---|---|---|
| `company_claim_summary` | string \| null | Summary of what the company claims. |
| `object_property` | string \| null | Ontology relationship inferred, e.g. `contradictedBy`, `supportedBy`. |
| `judgment` | string \| null | The LLM's verdict on the claim. |
| `greenwashing_status` | string \| null | Overall greenwashing classification. |
| `reason_for_judgement` | string \| string[] \| null | Explanation for the verdict. |
| `summary_support_evidence` | string \| null | Summary of supportive evidence found. |
| `summary_counter_evidence` | string \| null | Summary of contradicting evidence found. |
| `retrieved_documents` | object \| null | `{ company_reports[], counterfactual_sources[], supportive_sources[] }`, each a list of citations (`title`, `company`, `date`, `year`, `article`, `url`). |
| `error` | string \| null | Set instead of the above if the LLM output couldn't be parsed as JSON. |
| `raw_content` | string \| null | Raw LLM output, present alongside `error`. |

**Example**

```bash
curl -X POST http://127.0.0.1:8000/analyze \
  -H "Authorization: Bearer <supabase-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"company": "some-company", "topic": "carbon emissions"}'
```

### `POST /organizations`

| Field | Type | Description |
|---|---|---|
| `user_id` | string | Supabase auth user ID (from the just-completed `signUp()` response). |
| `name` | string | Organization name. |
| `tin` | string | Tax identification number. |

Returns `201` with `{id, user_id, name, tin, status: "pending"}`, or `409` if an organization already
exists for that `user_id`.

### `GET /organizations/me`

Query param `user_id`. Returns the matching organization or `404`.

## Software tools used

| Tool | Purpose in Synapse | Why it was chosen |
|---|---|---|
| **FastAPI** | Backend web framework serving `/health`, `/organizations`, `/analyze` | Async-native, Pydantic-integrated request/response validation, and auto-generated OpenAPI docs speed up iteration on the API contract |
| **Uvicorn** | ASGI server running the FastAPI app | Standard, lightweight production-grade server for FastAPI with hot-reload for development |
| **Supabase (Auth + Postgres)** | User authentication and organization storage | Managed auth (JWT issuing, JWKS) and Postgres removes the need to run/own auth infrastructure |
| **SQLAlchemy (async) + asyncpg** | Async DB session/engine for Postgres access | Non-blocking DB I/O inside FastAPI's async request handlers |
| **PyJWT + cryptography** | Verifying Supabase-issued JWTs against the project's JWKS | Standards-compliant JWT verification without a full auth SDK |
| **Pydantic / pydantic-settings** | Request/response schemas, `.env`-driven settings | Type-safe validation at the API boundary and typed configuration loading |
| **LangChain** (`langchain-community`, `langchain-text-splitters`, `langchain-ollama`, `langchain-huggingface`) | Glue for document loading, chunking, embeddings and LLM invocation | Common interface across embeddings/vector stores/LLMs so the RAG pipeline isn't hand-rolled for each provider |
| **Ollama** running **Mistral 7B** | Local LLM inference for claim evaluation | Runs entirely on-device — no per-call API cost and no ESG report data leaving the machine, important given the sensitivity/volume of documents processed during development |
| **sentence-transformers** (`all-MiniLM-L6-v2`) | Embedding model for document/query vectors | Small, fast, strong general-purpose sentence embedding model suitable for semantic similarity at retrieval time |
| **FAISS** | Vector similarity search over embedded ESG documents | Fast local, file-backed vector index — no external vector DB service needed for the corpus size involved |
| **Owlready2 + HermiT reasoner** | Loading `ontology.owl`, reasoning over classes/instances/SWRL rules | Provides the **symbolic** half of the neurosymbolic pipeline: explicit greenwashing concepts, relationships and inference rules that ground/constrain the LLM's output rather than relying on the LLM alone |
| **Protégé** | Authoring/editing the OWL ontology | De facto standard ontology editor, needed to design the classes, object properties and SWRL rules consumed by `owlready2` |
| **pandas** | Dataset loading and preprocessing (`DataPreprocessing/`, `build_vectorstore.py`) | Standard tool for tabular ESG dataset cleaning, transforms and CSV I/O |
| **rouge-score** | Evaluating generated summaries against reference text (`Evaluation/`) | Standard metric for measuring text-generation quality/overlap during pipeline evaluation |
| **httpx** | Fetching Supabase JWKS for token verification | Async-friendly HTTP client consistent with FastAPI's async style |
| **python-dotenv** | Loading `.env` values | Simple local config loading during development/scripts |

## Notes / known caveats

- Root-level `main.py` in earlier commits and this README's old instructions referenced `api.py` /
  `python -m uvicorn api:app` — that layout has been superseded by the `app/` + `synapse_core/`
  structure described above; use `uvicorn app.main:app --reload`.
- `synapse_core/retrieval.py` imports `HuggingFaceEmbeddings` from `langchain_community.embeddings`,
  which is deprecated in favor of `langchain_huggingface.HuggingFaceEmbeddings` (already a dependency).
- See the [Vector store](#4-vector-store) caveat above regarding `build_vectorstore.py`'s relative paths.
