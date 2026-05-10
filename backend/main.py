from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
from contextlib import asynccontextmanager

from routers import auth, students, class_insights, hod, admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("\n[STARTING] FAIL SAFE MULTI-TENANT ENGINE STARTING...")
    yield

app = FastAPI(lifespan=lifespan)
models.Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(students.router)
app.include_router(class_insights.router)
app.include_router(hod.router)
app.include_router(admin.router)
