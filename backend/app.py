from backend.core.database import Base, engine
from backend.api.v1.routers.members import router as members_router
from fastapi import FastAPI

from backend.core.config import get_settings

settings = get_settings()
print(settings.database_url)

app = FastAPI(
    title="IMCX PAX ROMANA-UMaT LOCAL",
    description="This is a simple API for managing the IMCX PAX ROMANA-UMaT LOCAL.",
    version="1.0.0", 
)

# Include routers
app.include_router(members_router, tags=["Members"])

@app.get("/")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)