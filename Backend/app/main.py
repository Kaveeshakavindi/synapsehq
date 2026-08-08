from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import (
    analyses,
    analyze,
    companies,
    dashboard,
    health,
    organizations,
    reports,
    subscription,
    support,
)

app = FastAPI(title="Synapse UD API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(organizations.router)
app.include_router(analyze.router)
app.include_router(companies.router)
app.include_router(dashboard.router)
app.include_router(analyses.router)
app.include_router(reports.router)
app.include_router(subscription.router)
app.include_router(support.router)