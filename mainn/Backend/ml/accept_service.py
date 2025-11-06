from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional, List
import uvicorn

app = FastAPI()

class PredictReq(BaseModel):
    pickup: str = ""
    destination: str = ""
    distanceKm: float = 0.0
    durationMin: float = 0.0
    fare: float = 0.0
    vehicleType: str = "Auto"
    hourOfDay: int = 12
    userRating: float = 4.5
    captainRating: float = 4.5
    horizon: int = 6

class PredictResp(BaseModel):
    probAccept: float
    series: List[float]

@app.post("/predict", response_model=PredictResp)
async def predict(req: PredictReq):
    # Simple placeholder "ML" score so you can see ML badge:
    # Base on distance, duration, hour, and ratings
    dist = req.distanceKm
    dur = req.durationMin
    hr = req.hourOfDay
    cap = req.captainRating
    usr = req.userRating

    # A smooth function bounded in [0,1]
    base = 0.65
    short_boost = 0.15 if dist < 5 else 0.05 if dist < 10 else -0.05
    rush_penalty = -0.1 if (18 <= hr <= 21) else 0.0
    rating_adj = (cap - 4.0) * 0.05 + (usr - 4.0) * 0.03
    prob = max(0.0, min(1.0, base + short_boost + rush_penalty + rating_adj))

    # Create a small series to draw a sparkline in UI (next 30 min)
    series = []
    step = (0.02 if prob < 0.8 else -0.02)
    val = prob
    for _ in range(max(1, req.horizon)):
        series.append(max(0.0, min(1.0, val)))
        val += step
    return {"probAccept": prob, "series": series}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
