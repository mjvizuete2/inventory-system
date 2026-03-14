from langchain.agents import create_sql_agent
from langchain.sql_database import SQLDatabase
from langchain.chat_models import ChatOpenAI

db = SQLDatabase.from_uri(
    "mysql+pymysql://app:app123@db/inventario"
)

llm = ChatOpenAI(model="gpt-4")

agent = create_sql_agent(
    llm=llm,
    db=db,
    verbose=True
)