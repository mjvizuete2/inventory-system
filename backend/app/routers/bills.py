from fastapi import APIRouter

router = APIRouter(prefix="/bills")

@router.get("/")
def listar_bills():
    return {"bills": []}