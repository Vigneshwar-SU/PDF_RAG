from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from backend.rag import answer_question_from_pdf

app = FastAPI()

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.post("/upload-ask")
async def upload_and_ask(
    file: UploadFile = File(...),
    question: str = Form(...)
):
    """
    Single endpoint that handles both PDF upload and question answering.
    """
    try:
        answer = answer_question_from_pdf(file, question)
        return {"answer": answer}
    except Exception as e:
        return {"error": str(e), "answer": "Sorry, I couldn't process your question. Please try again."}

@app.get("/")
async def root():
    return {"message": "PDF Q&A API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
