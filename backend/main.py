from typing import List, Optional, Union
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RecommendRequest(BaseModel):
    size_category: Union[List[str], str]
    age_category: Union[List[str], str]
    sex_category: Optional[Union[List[str], str]] = None  
    sex: Optional[Union[List[str], str]] = None          
    traits: List[int]
    top_n: Optional[int] = 5


@app.get("/")
def read_root():
    return {"status": "online", "system": "CanineMatch API"}


@app.post("/recommend")
def get_recommendations(user: RecommendRequest, top_n: Optional[int] = None):
    user_payload = user.dict() if hasattr(user, "dict") else user.model_dump()
    n_results = top_n if top_n is not None else user.top_n
    try:
        from .recommender import recommend_dogs
    except ImportError:
        from recommender import recommend_dogs
    results = recommend_dogs(user_payload, top_n=n_results)
    return {"results": results}