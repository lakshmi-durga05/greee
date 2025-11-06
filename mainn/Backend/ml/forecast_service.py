from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import uvicorn

app = FastAPI()

class Point(BaseModel):
    ts: str
    y: int

class ForecastReq(BaseModel):
    series: List[Point]
    horizon: int

class ForecastResp(BaseModel):
    forecast: List[int]

@app.post("/forecast", response_model=ForecastResp)
async def forecast(req: ForecastReq):
    ys = [p.y for p in req.series]
    last = ys[-1] if ys else 0
    # Simple trend output so you can see ML badge change in UI; replace with real LSTM later
    out = [max(0, int(last + (i+1))) for i in range(req.horizon)]
    return {"forecast": out}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
