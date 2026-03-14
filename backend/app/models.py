from sqlalchemy import Column, Integer, String, DECIMAL, Boolean
from app.database import Base

class Producto(Base):
    __tablename__ = "producto"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(150))
    codigo = Column(String(50))
    precio = Column(DECIMAL(10,2))
    iva = Column(Boolean)


class Cliente(Base):
    __tablename__ = "cliente"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(150))
    identificacion = Column(String(20))
    email = Column(String(150))