# main.py
from fastapi import FastAPI, Depends
from auth import get_current_user

app = FastAPI()

@app.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return {"user_id": user["sub"], "email": user.get("email")}