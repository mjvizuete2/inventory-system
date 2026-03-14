from langchain.chat_models import ChatOpenAI

llm = ChatOpenAI(model="gpt-4")

def generar_crud(tabla):

    prompt = f"""
    genera endpoints CRUD en fastapi para la tabla {tabla}
    """

    return llm.predict(prompt)