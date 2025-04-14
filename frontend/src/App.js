// src/App.js


import React, { useState } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';
import './App.css';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-r';
import 'ace-builds/src-noconflict/theme-monokai';


function App() {
 const [language, setLanguage] = useState('Python');
 const [code, setCode] = useState('');
 const [image, setImage] = useState(null);
 const [plotlySpec, setPlotlySpec] = useState(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState(null);


 const handleGenerate = async () => {

      // clear out any old error or outputs
      setError(null);
      setPlotlySpec(null);
      setImage(null);
      setLoading(true);

  try {
      const response = await axios.post(
        'http://127.0.0.1:5000/generate',
        { code, language },
        { validateStatus: status => status < 500 }
      );


      if (response.data.error) {
        const raw = response.data.raw
          ? `\n\n(raw JSON snippet)\n${response.data.raw}`
          : '';
        setError(response.data.error + raw);
        setPlotlySpec(null);
        setImage(null);
      } else if (response.data.plotly_spec) {
        // Got an interactive spec
        setPlotlySpec(response.data.plotly_spec);
        setImage(null);
      } else if (response.data.image) {
        // Got a static PNG
        setImage(response.data.image);
        setPlotlySpec(null);
      } else {
        // Unexpected shape
        setError('Unexpected response from server.');
        setPlotlySpec(null);
        setImage(null);
      }
    } catch (err) {
      console.error('Network or server error:', err);
      setError('There was an error.');
    } finally {
      setLoading(false);
    }
  };

 return (
   <div className="App">
     {/* Hero Section */}
     <section className="hero-section">
       <div className="hero-content">
         <h1 className="hero-title">Langnostic</h1>
         <p className="hero-tagline">
           A language agnostic tool to visualize your dreams
         </p>
       </div>
     </section>


     {/* Generator Section */}
     <section className="generator-section">
       <h2>Visualization Generator</h2>


       <div className="form-row">
         <label>Select Language:</label>
         <select
           value={language}
           onChange={e => setLanguage(e.target.value)}
         >
           <option value="Python">Python</option>
           <option value="R">R</option>
         </select>
       </div>


       <div className="form-row">

       <AceEditor
        mode={language.toLowerCase()}
        theme="monokai"
        name="code-editor"
        onChange={setCode}
        value={code}
        fontSize={14}
        showPrintMargin={false}
        showGutter={true}
        highlightActiveLine={true}
        width="100%"
        height="300px"
        setOptions={{
          showLineNumbers: true,
          tabSize: 2,
          // enableBasicAutocompletion: true,
          // enableLiveAutocompletion: true,
          // enableSnippets: true,
        }}
      />

       </div>
       {language === 'R' && (
       <div className="hint-msg">
      For R code, please assign your ggplot2 plot to <code>r_plot</code> or your plotly plot to <code>r_plotly</code>.
      </div>
         )}


       <div className="form-row button-row">
         <button onClick={handleGenerate} disabled={loading}>
           {loading ? 'Generating...' : 'Generate'}
         </button>
       </div>


       {error && <div className="error-msg">{error}</div>}


       <div className="output-container">
         {plotlySpec ? (
           <Plot
             data={plotlySpec.data}                                          
             layout={plotlySpec.layout}                                      
            //  data={JSON.parse(plotlySpec).data}  
            //  layout={JSON.parse(plotlySpec).layout}
             useResizeHandler
             style={{ width: '100%', height: '100%' }}
           />
         ) : image ? (
           <img
             src={`data:image/png;base64,${image}`}
             alt="Visualization"
           />
         ) : (
           <p>Your generated visualization will appear here.</p>
         )}
       </div>
     </section>
   </div>
 );
}

export default App;
