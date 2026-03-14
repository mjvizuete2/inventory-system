from fastapi import APIRouter
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Producto

router = APIRouter(prefix="/productos")

@router.get("/")
def listar():

    db: Session = SessionLocal()

    productos = db.query(Producto).all()

    return productos


@router.post("/")
def crear(producto: dict):

    db: Session = SessionLocal()

    nuevo = Producto(
        nombre=producto["nombre"],
        codigo=producto["codigo"],
        precio=producto["precio"],
        iva=producto["iva"]
    )

    db.add(nuevo)
    db.commit()

    return {"ok": True}