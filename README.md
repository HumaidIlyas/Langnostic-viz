# Langnostic

## 1a. Overview of Design and Tools Used

**Langnostic** is a language‑agnostic visualization web app that lets users write Python or R code to generate either static or interactive 2D plots. The core design is:

- **Frontend**: React application  
  - Code editor for Python/R snippets  
  - “Generate” button triggers a POST to the Flask backend  
  - Renders either a `<Plotly>` interactive chart or an `<img>` tag for static PNGs  

- **Backend**: Flask server  
  - Receives `{ code, language }`  
  - Executes user code in a controlled namespace  
  - **Static** (PNG) via  
    - Python: Matplotlib/Seaborn → `fig.tight_layout()` → PNG → base64  
    - R: ggplot2 → `ggsave()` → PNG → base64  
  - **Interactive** via Plotly  
    - Python: detect any Plotly figure in `allowed_globals`, call `to_json()`  
    - R: use `plotly_build()` + `jsonlite::toJSON()` to serialize the full spec  
  - Returns JSON with either `{"image": "...base64..."}` or `{"plotly_spec": {...}}
  
  - **R Plot Variable Naming**: In the R snippet, user must assign  ggplot2 object to r_plot or your Plotly object to r_plotly so the backend can detect and render it.

## 1b. Issues Encountered and Resolutions

- **Python static plots were clipped**  
  *Resolution:* Added `fig.tight_layout()` before saving to ensure all axes labels and titles appear.

- **Python interactive Plotly objects not detected**  
  *Resolution:* Scanned the execution namespace for any object whose `__class__.__module__` starts with `"plotly"`, then used its `to_json()` method.

- **R static ggplot2 output not reliably written**  
  *Resolution:* Created a `tempfile.NamedTemporaryFile()` in Python, passed its path to `ggsave()`, then read and base64‑encoded the PNG.

- **R interactive plotly serialization failed**  
  *Resolution:* Wrapped the ggplotly object in `plotly_build()` before calling `jsonlite::toJSON(..., auto_unbox=TRUE, force=TRUE)` to get a complete, flat JSON spec.
