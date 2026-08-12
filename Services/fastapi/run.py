#!/usr/bin/env python
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app", host="localhost", port=1974, reload=True, log_level="info"
    )
