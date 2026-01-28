import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import html2pdf from 'html2pdf.js';
import mermaid from 'mermaid';

function StrategyGenerator() {
  const [formData, setFormData] = useState({
    strategy_type: 'general',
    stage: 'early',
    industry: '',
    keywords: '',
    diagram_style: 'TD'
  });
  const [strategyTypes, setStrategyTypes] = useState([]);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [diagramSvg, setDiagramSvg] = useState('');
  const [language, setLanguage] = useState('English');
  const mermaidRef = useRef(null);

  // Fetch strategy types on component mount
  useEffect(() => {
    const fetchStrategyTypes = async () => {
      try {
        const response = await axios.get('http://localhost:8000/strategy-types');
        const types = Object.entries(response.data).map(([key, value]) => ({
          id: key,
          ...value
        }));
        setStrategyTypes(types);
      } catch (error) {
        console.error('Error fetching strategy types:', error);
        setError('Failed to load strategy types');
      }
    };
    fetchStrategyTypes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateStrategy = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('http://localhost:8000/generate-strategy', {
        strategy_type: formData.strategy_type,
        stage: formData.stage,
        industry: formData.industry,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        diagram_style: formData.diagram_style
      });
      setResponse(res.data);

      // Detect the language of the strategy response
      const isArabic = /[\u0600-\u06FF]/.test(res.data.strategy);
      setLanguage(isArabic ? 'Arabic' : 'English');
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.detail || 'An error occurred while generating the strategy');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!response) return;
  
    setLoading(true);
    try {
      const element = document.getElementById('strategy-content');
  
      // Add title and creation date
      const titleDiv = document.createElement('div');
      titleDiv.className = 'pdf-header';
      titleDiv.innerHTML = `
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-blue-600 mb-2">
            ${language === 'Arabic' ? 
              `${strategyTypes.find(t => t.id === formData.strategy_type)?.name.ar} استراتيجية لـ ${formData.industry}` : 
              `${strategyTypes.find(t => t.id === formData.strategy_type)?.name.en} Strategy for ${formData.industry}`}
          </h1>
          <p class="text-sm text-gray-400">
            ${language === 'Arabic' ? 
              `تاريخ الإنشاء: ${new Date().toLocaleDateString('ar-EG')}` : 
              `Creation Date: ${new Date().toLocaleDateString('en-US')}`}
          </p>
        </div>
      `;
      element.insertBefore(titleDiv, element.firstChild);
  
      const mermaidDiv = document.querySelector('.mermaid-svg');
      if (mermaidDiv) {
        const waitForRender = new Promise((resolve) => {
          const observer = new MutationObserver((mutations, obs) => {
            if (mermaidDiv.querySelector('svg')) {
              obs.disconnect();
              mermaidDiv.style.display = 'none';
              void mermaidDiv.offsetHeight;
              mermaidDiv.style.display = 'block';
              resolve();
            }
          });
          observer.observe(mermaidDiv, { childList: true, subtree: true });
  
          setTimeout(() => {
            observer.disconnect();
            resolve();
          }, 10000);
        });
  
        await waitForRender;
  
        const svgElement = mermaidDiv.querySelector('svg');
        if (svgElement) {
          const originalWidth = svgElement.getAttribute('width') || svgElement.viewBox.baseVal.width;
          const originalHeight = svgElement.getAttribute('height') || svgElement.viewBox.baseVal.height;
          const maxWidth = 600;
          const scaleFactor = maxWidth / originalWidth;
  
          svgElement.setAttribute('width', maxWidth);
          svgElement.setAttribute('height', originalHeight * scaleFactor);
          svgElement.style.maxWidth = '100%';
          svgElement.style.overflow = 'visible';
  
          let svgContent = svgElement.outerHTML;
  
          const fixColors = (svg) =>
            svg
              .replace(/fill="#?fff(f)?"/gi, 'fill="#000000"')
              .replace(/fill="white"/gi, 'fill="#000000"')
              .replace(/style="[^"]*color:\s*(white|#fff(f)?)\b[^"]*"/gi, 'style="color: black"')
              .replace(/style="[^"]*fill:\s*(white|#fff(f)?)\b[^"]*"/gi, 'style="fill: #000000"');
          
          svgContent = fixColors(svgContent);
  
          svgContent = svgContent.replace('<rect', '<rect fill="white" stroke="black" stroke-width="1"');
          
          const newSvgDiv = document.createElement('div');
          newSvgDiv.innerHTML = svgContent;
          mermaidDiv.innerHTML = '';
          mermaidDiv.appendChild(newSvgDiv.firstChild);
        }
      }
  
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `${language === 'Arabic' ? 
          `استراتيجية_${strategyTypes.find(t => t.id === formData.strategy_type)?.name.ar}_${formData.industry}` : 
          `Strategy_${strategyTypes.find(t => t.id === formData.strategy_type)?.name.en}_${formData.industry}`}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: {
          scale: 3,
          useCORS: true,
          scrollX: 0,
          scrollY: 0,
          width: element.scrollWidth,
          windowWidth: element.scrollWidth,
          dpi: 300,
          backgroundColor: 'transparent',
        },
        jsPDF: {
          unit: 'in',
          format: 'letter',
          orientation: 'portrait',
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };
  
      await html2pdf().set(opt).from(element).save();
      element.removeChild(titleDiv);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Error occurred while generating PDF');
    } finally {
      setLoading(false);
    }
  };
  
  // Mermaid render effect
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      themeCSS: `
        .label text, text, .edgeLabel, .nodeLabel, .label, .edgePath, .arrowheadPath, tspan {
          fill: ${darkMode ? '#ffffff' : '#000000'} !important;
          color: ${darkMode ? '#ffffff' : '#000000'} !important;
          font-size: 14px !important;
          font-family: 'Arial', sans-serif !important;
        }
        .node rect, .node polygon, .cluster rect {
          fill: ${darkMode ? '#374151' : '#ffffff'} !important;
          stroke: ${darkMode ? '#9CA3AF' : '#000000'} !important;
        }
        .label foreignObject div, .label foreignObject span, .label foreignObject p {
          color: ${darkMode ? '#ffffff' : '#000000'} !important;
          fill: ${darkMode ? '#ffffff' : '#000000'} !important;
        }
        [fill="#fff"], [fill="#ffffff"], [fill="white"] {
          fill: ${darkMode ? '#374151' : '#ffffff'} !important;
        }
      `,
      flowchart: {
        useMaxWidth: false,
        diagramPadding: 8,
        nodeSpacing: 20,
        rankSpacing: 50,
        htmlLabels: true,
      },
      securityLevel: 'loose',
    });
  
    if (response?.workflow_diagram) {
      const renderDiagram = async () => {
        try {
          const { svg } = await mermaid.render('mermaid-diagram', response.workflow_diagram);
          const fixColors = (svg) =>
            svg
              .replace(/fill="#?fff(f)?"/gi, `fill="${darkMode ? '#374151' : '#000000'}"`)
              .replace(/fill="white"/gi, `fill="${darkMode ? '#374151' : '#ffffff'}"`)
              .replace(/style="[^"]*color:\s*(white|#fff(f)?)\b[^"]*"/gi, `style="color: ${darkMode ? '#ffffff' : '#000000'}"`)
              .replace(/style="[^"]*fill:\s*(white|#fff(f)?)\b[^"]*"/gi, `style="fill: ${darkMode ? '#374151' : '#ffffff'}"`);
  
          setDiagramSvg(fixColors(svg));
        } catch (err) {
          console.error('Failed to render Mermaid diagram:', err);
          setDiagramSvg(`<p>${language === 'Arabic' ? 'فشل تحميل المخطط' : 'Failed to load diagram'}</p>`);
        }
      };
      renderDiagram();
    }
  }, [response, darkMode, language]);

  return (
    <div className={`min-h-screen p-4 md:p-8 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
      <div className={`max-w-4xl mx-auto p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Mobadroot</h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-700'}`}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block font-medium">{language === 'Arabic' ? 'نوع الاستراتيجية' : 'Strategy Type'}</label>
              <select
                name="strategy_type"
                value={formData.strategy_type}
                onChange={handleChange}
                className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              >
                {strategyTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {language === 'Arabic' ? type.name.ar : type.name.en}
                  </option>
                ))}
              </select>
              {formData.strategy_type && (
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {language === 'Arabic' ? 
                    strategyTypes.find(t => t.id === formData.strategy_type)?.description.ar : 
                    strategyTypes.find(t => t.id === formData.strategy_type)?.description.en}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block font-medium">{language === 'Arabic' ? 'نمط المخطط' : 'Diagram Style'}</label>
              <select
                name="diagram_style"
                value={formData.diagram_style}
                onChange={handleChange}
                className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              >
                <option value="TD">{language === 'Arabic' ? 'رأسي (من أعلى لأسفل)' : 'Vertical (Top-Down)'}</option>
                <option value="LR">{language === 'Arabic' ? 'أفقي (من اليسار لليمين)' : 'Horizontal (Left-Right)'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block font-medium">{language === 'Arabic' ? 'مرحلة الشركة' : 'Company Stage'}</label>
              <select
                name="stage"
                value={formData.stage}
                onChange={handleChange}
                className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              >
                <option value="early">{language === 'Arabic' ? 'مرحلة مبكرة' : 'Early Stage'}</option>
                <option value="growth">{language === 'Arabic' ? 'مرحلة نمو' : 'Growth Stage'}</option>
                <option value="mature">{language === 'Arabic' ? 'مرحلة ناضجة' : 'Mature Stage'}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block font-medium">{language === 'Arabic' ? 'الصناعة' : 'Industry'}</label>
              <Input
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                placeholder={language === 'Arabic' ? 'مثال: تكنولوجيا، الرعاية الصحية...' : 'e.g., Technology, Healthcare...'}
                className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-medium">{language === 'Arabic' ? 'الكلمات المفتاحية' : 'Keywords'}</label>
            <Input
              name="keywords"
              value={formData.keywords}
              onChange={handleChange}
              placeholder={language === 'Arabic' ? 'مفصولة بفواصل' : 'Comma-separated'}
              className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
            />
          </div>

          <div className="flex gap-4">
            <Button
              onClick={generateStrategy}
              disabled={loading || !formData.industry}
              className={`flex-1 py-3 rounded-xl text-lg ${(!formData.industry || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {language === 'Arabic' ? 'جارٍ التوليد...' : 'Generating...'}
                </span>
              ) : (language === 'Arabic' ? 'توليد الاستراتيجية' : 'Generate Strategy')}
            </Button>

            {response && (
              <Button
                onClick={generatePDF}
                disabled={loading}
                className="flex-1 py-3 rounded-xl text-lg bg-green-600 hover:bg-green-700"
              >
                {language === 'Arabic' ? 'تحويل إلى PDF' : 'Convert to PDF'}
              </Button>
            )}
          </div>

          {error && (
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-700'}`}>
              <p>{error}</p>
            </div>
          )}

          {response && (
            <div className="space-y-8 mt-8" id="strategy-content">
              <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-blue-50'} ${language === 'Arabic' ? 'text-right' : 'text-left'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-blue-600">
                    {language === 'Arabic' ? 'الاستراتيجية' : 'Strategy'}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-800'}`}>
                    {language === 'Arabic' ? 
                      strategyTypes.find(t => t.id === formData.strategy_type)?.name.ar : 
                      strategyTypes.find(t => t.id === formData.strategy_type)?.name.en}
                  </span>
                </div>
                <p className={`whitespace-pre-line leading-relaxed ${language === 'Arabic' ? 'text-right' : 'text-left'}`}>
                  {response.strategy}
                </p>
              </div>

              <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-green-50'} ${language === 'Arabic' ? 'text-right' : 'text-left'}`}>
                <h2 className="text-2xl font-bold mb-4 text-green-600">
                  {language === 'Arabic' ? 'مؤشرات الأداء الرئيسية' : 'Key Performance Indicators'}
                </h2>
                <ul className={`space-y-3 ${language === 'Arabic' ? 'pr-6' : 'pl-6'}`} style={{ listStyleType: 'disc', direction: language === 'Arabic' ? 'rtl' : 'ltr' }}>
                  {response.kpis.map((kpi, index) => (
                    <li key={index} className="leading-relaxed">{kpi}</li>
                  ))}
                </ul>
              </div>

              <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-purple-50'} ${language === 'Arabic' ? 'text-right' : 'text-left'}`}>
                <h2 className="text-2xl font-bold mb-4 text-purple-600">
                  {language === 'Arabic' ? 'مخطط سير العمل' : 'Workflow Diagram'}
                </h2>
                <div 
                  className="mermaid-svg" 
                  ref={mermaidRef} 
                  style={{ 
                    overflowX: 'auto', 
                    width: '100%', 
                    maxWidth: '800px', 
                    margin: '0 auto',
                    direction: 'ltr'
                  }}
                >
                  {diagramSvg ? (
                    <div dangerouslySetInnerHTML={{ __html: diagramSvg }} style={{ width: '100%', overflow: 'visible' }} />
                  ) : (
                    <p>{language === 'Arabic' ? 'جارٍ تحميل المخطط...' : 'Loading diagram...'}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StrategyGenerator;