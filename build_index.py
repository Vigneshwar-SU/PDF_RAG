from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaEmbeddings

# 1. Load PDF
loader = PyPDFLoader("data/sample.pdf")
documents = loader.load()

# 2. Split text
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50
)
chunks = splitter.split_documents(documents)

# 3. Create embeddings
embeddings = OllamaEmbeddings(model="llama3")

# 4. Create FAISS index
vectorstore = FAISS.from_documents(chunks, embeddings)

# 5. Save index
vectorstore.save_local("faiss_index")

print("✅ FAISS index created successfully")
