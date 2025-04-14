# backend/app.py

# Use a non-interactive backend for Matplotlib
import matplotlib
matplotlib.use('Agg')
import traceback

from flask import Flask, request, jsonify
from flask_cors import CORS
import io
import os
import json
import tempfile
import base64
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
import plotly.io as pio  
import plotly.graph_objects as go


# R Imports
import rpy2.robjects as ro
from rpy2.robjects import default_converter
from rpy2.robjects.conversion import localconverter
from rpy2.robjects.packages import importr
from rpy2.robjects import globalenv
from rpy2.robjects.packages import importr
from rpy2.rinterface_lib.embedded import RRuntimeError


# Preload R libraries
importr('ggplot2')
importr('plotly')
importr('jsonlite')
importr('magrittr') 

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return "Hello, this is the Flask backend for the Visualization App!"

@app.route('/generate', methods=['POST'])
def generate_visualization():
    # Get the JSON payload from the request
    data = request.get_json()
    print("🔥 Received payload:", data, flush=True)
    user_code = data.get('code', '')
    print("🔥 User code:\n", user_code, flush=True)
    language = data.get('language', 'Python')  # We assume Python for now
    print("🔥 Language selected:", language, flush=True)
    
    try:
        if language == 'R':
            

            # Import r libraries
            ro.r('library(ggplot2)')
            ro.r('library(plotly)')
            ro.r('library(magrittr)')
            # Clear any existing R graphics 
            ro.r('graphics.off()')
            ro.r('rm(list=ls())')

            

            with localconverter(default_converter):
                r_parse = ro.r['parse']
                try:
                    r_parse(text=user_code)
                except RRuntimeError as pe:
                    return jsonify({'error': str(pe)}), 400
                ro.r(user_code)

            
            r_vars = list(globalenv.keys())



            # 1) Interactive Plotly for R

            if 'r_plotly' in r_vars:

                try:
                    with localconverter(default_converter):
                        spec_vec = ro.r(
                            'jsonlite::toJSON(plotly_build(r_plotly)$x, auto_unbox=TRUE, force=TRUE)'
                        )
                except Exception as e:
                    print("R→JSON call failed:", e, flush=True)
                    return jsonify({'error': f"R JSON serialization failed: {e}"}), 500


                json_str = spec_vec[0]


                # parse into Python dict
                spec = json.loads(json_str)
                return jsonify({'plotly_spec': spec})


            # 2) Static ggplot2
            elif 'r_plot' in r_vars:
                # Save ggplot2 object to a temporary PNG
                print(" Detected ggplot — generating static", flush=True)
                
                tmp = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
                tmp.close()
                # ggsave writes the file
                ro.r(f'ggsave(filename="{tmp.name}", plot=r_plot, device="png", width=6, height=4)')
                # Read & encode
                with open(tmp.name, 'rb') as f:
                    img_bytes = f.read()
                os.unlink(tmp.name)
                img_base64 = base64.b64encode(img_bytes).decode('utf-8')
                return jsonify({'image': img_base64})
            else:
                return jsonify({'error': "R code must assign the plot to r_plot for ggplot2 or r_plotly for plotly."}), 400

        elif language == 'Python':
            # Clear Matplotlib state
            plt.close('all')

            # Prepare safe globals
            allowed_globals = {
                'plt': plt,
                'sns': sns,
                'pd': pd,
                'np': np,
                'pio': pio,
                '__builtins__': {'__import__': __import__}
            }

            # Execute Python code
            exec(user_code, allowed_globals)

            # 1) Interactive Plotly for Python

            # Search allowed_globals for a Plotly object (name-agnostic search)
            ignored = {"plt", "sns", "pd", "np", "pio", "__builtins__"}
            plotly_obj = None
            for key, obj in allowed_globals.items():
                if key in ignored:
                    continue
                try:
                    module_name = obj.__class__.__module__
                    # Check if the object's class comes from the plotly package.
                    if module_name.startswith("plotly"):
                        plotly_obj = obj
                        print(f"✅ Detected Plotly object '{key}' from module '{module_name}'", flush=True)
                        break
                except Exception as e:

                    continue

            if plotly_obj:
                # Use Plotly's to_json() to get a JSON string.
                spec_json = plotly_obj.to_json() 
                # Convert JSON string into a Python dictionary.
                spec = json.loads(spec_json)
                return jsonify({'plotly_spec': spec})


            # 2) Static Matplotlib
            fig = plt.gcf()
            fig.tight_layout()
            buf = io.BytesIO()
            fig.savefig(buf, format='png')
            buf.seek(0)
            img_bytes = buf.getvalue()
            img_base64 = base64.b64encode(img_bytes).decode('utf-8')
            return jsonify({'image': img_base64})

        else:
            return jsonify({'error': f"Language '{language}' not supported."}), 400

    except Exception as e:
        # return jsonify({'error': str(e)}), 500

        # capture full traceback
        tb = traceback.format_exc()
        # return 400 so the front end will treat this as a user‐level error
        return jsonify({
            'error': str(e),
            'raw': tb   # we’ll display this under the error
        }), 400

if __name__ == '__main__':
    app.run(debug=True)

    ro.r('1+1')
