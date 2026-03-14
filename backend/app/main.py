from fastapi import FastAPI
from app.database import engine
from app.models import Base
from app.routers import products, clients, bills

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.include_router(products.router)
app.include_router(clients.router)
app.include_router(bills.router)