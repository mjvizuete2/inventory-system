from fastapi import APIRouter

router = APIRouter(prefix="/clients")

@router.get("/")
def listar_clientes():
    return {"clients": []}