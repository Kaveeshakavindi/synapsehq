from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from synapse_core.pipeline import evaluate_claim 
from Evaluation.generateTestSet import compute_rouge_for_test_set

app = FastAPI(title="ESG Claim Evaluation API")

# Allow frontend origins
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],   
    allow_headers=["*"],
)

# request body structure
class ClaimRequest(BaseModel):
    company: str
    query: str

# endpoint 
@app.post("/evaluate_claim")
def evaluate(request: ClaimRequest):
    try:
        result = evaluate_claim(request.query, request.company)
        # compute_rouge_for_test_set()
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
