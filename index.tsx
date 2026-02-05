/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: '#000',
    color: '#ccc',
    overflow: 'hidden',
    fontFamily: "'Courier New', Courier, monospace", // TUI Font
    fontSize: '14px',
  },
  header: {
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#000',
    borderBottom: '1px solid #333',
    zIndex: 20,
    textTransform: 'uppercase' as const,
  },
  headerTitle: {
    fontWeight: 'bold',
    letterSpacing: '2px',
    marginRight: '20px',
    color: '#fff',
  },
  gameWrapper: {
    flex: 1,
    position: 'relative' as const,
    width: '100%',
    height: '100%',
    background: '#000',
    overflow: 'hidden',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block',
    backgroundColor: '#000',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
  },
  button: (active: boolean) => ({
    background: active ? '#ccc' : '#000',
    color: active ? '#000' : '#ccc',
    border: '1px solid #ccc',
    padding: '4px 10px',
    fontSize: '12px',
    cursor: 'pointer',
    outline: 'none',
    fontFamily: 'inherit',
    textTransform: 'uppercase' as const,
    boxShadow: active ? 'none' : '2px 2px 0px #333',
    transform: active ? 'translate(1px, 1px)' : 'none',
  }),
  modalOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto' as const,
    zIndex: 50,
  },
  modal: {
    background: '#000',
    border: '1px double #ccc', // Double border for TUI feel
    padding: '24px',
    width: '520px',
    maxWidth: '90%',
    color: '#ccc',
    boxShadow: '10px 10px 0px #222',
  },
  modalHeader: {
    fontSize: '20px',
    fontWeight: 'bold' as const,
    marginBottom: '16px',
    borderBottom: '1px dashed #666',
    paddingBottom: '8px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    textAlign: 'center' as const,
  },
  modalSub: {
    marginBottom: '24px',
    fontSize: '13px',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap' as const,
  },
  remixItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '8px',
    border: '1px solid transparent',
    marginBottom: '8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  remixIcon: {
    fontSize: '16px',
    width: '24px',
    textAlign: 'center' as const,
  },
  closeBtn: {
    width: '100%',
    padding: '12px',
    marginTop: '16px',
    background: '#000',
    color: '#fff',
    border: '1px solid #fff',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textTransform: 'uppercase' as const,
    fontWeight: 'bold' as const,
  },
  promptBox: {
    background: '#111',
    border: '1px solid #444',
    padding: '12px',
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: '12px',
    color: '#aaa',
    minHeight: '150px',
    maxHeight: '300px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap' as const,
  },
  loadingContainer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    background: '#000',
    zIndex: 5,
    fontFamily: "'Courier New', Courier, monospace",
  },
  asciiLoader: {
    whiteSpace: 'pre' as const,
    textAlign: 'center' as const,
    lineHeight: '1.2',
    marginBottom: '20px',
    color: '#fff'
  }
};

const PROMPTS = {
  gemini2p5: `
Create a TUI (Text User Interface) 3D web aesthetic experience in a single HTML file.

### Theme: "Ajayu: Dualism"
A slow, meditative visual experience exploring the dance between two forces: Chacha (Sun/Light) and Warmi (Moon/Shadow).

### Visual Style
*   **Monochrome ASCII:** Classic terminal aesthetics with organic motion.
*   **Atmosphere:** Slow, drifting particles that pulse and breathe.
*   **Movement:** Gentle oscillations between light and dark patterns.

### Experience
*   **No objectives or goals** - pure contemplation.
*   Sun and Moon symbols drift across the screen, creating evolving patterns.
*   The "balance" is visual only - watch the interplay of opposing forces.
*   Subtle animations respond to mouse movement (optional).
*   Continuous, endless loop - no fail states or endings.
`,
  gemini3: `
Create a Generative ASCII Art experience in a single HTML file using TUI aesthetics.

### Theme: "FLOW FIELD MEDITATION"
A mesmerizing visual field of characters that shift and flow in organic patterns.

### Visual Design
*   **The Field:** A dense grid of ASCII characters driven by Perlin noise vector fields.
*   **Motion:** Characters rotate, shift, and pulse based on underlying flow patterns.
*   **Mouse Interaction:** Cursor subtly influences the flow field, creating ripples and distortions.
*   **Color Palette:**
    *   **Gold (#FFD700):** High energy areas / flow convergence
    *   **Blue (#1E90FF):** Low energy / calm zones
    *   **Red (#FF4500):** Turbulent regions / flow divergence
    *   Gradients between states create smooth transitions.

### Aesthetic Focus
*   **No scores, no metrics** - pure visual poetry.
*   Optional minimal HUD showing flow intensity or pattern name (e.g. "Vortex", "Drift", "Stillness").
*   Continuous evolution - patterns emerge and dissolve organically.
*   Hypnotic, meditative quality - something to get lost in.
`
};

function App() {
  const [activeModel, setActiveModel] = useState('gemini3'); 
  const [showPrompt, setShowPrompt] = useState(false);
  const [showRemix, setShowRemix] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  
  const [gameHtml, setGameHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('GENERATING PATTERNS...');
  
  const htmlCache = useRef<{ [key: string]: string }>({});
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const switchModel = (model: string) => {
    if (activeModel === model) return;
    setGameHtml(null);
    setIsLoading(true);
    setLoadingText(model === 'gemini3' ? 'WEAVING FLOW FIELD...' : 'AWAKENING DUALISM...');
    setActiveModel(model);
  };

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'PAUSE_GAME', payload: showDisclaimer }, '*');
    }
  }, [showDisclaimer]);

  useEffect(() => {
    let isMounted = true;
    const url = activeModel === 'gemini3' ? './init/gemini3.html' : './init/gemini2p5.html';

    const loadGame = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load game');
        let html = await response.text();
        
        const baseTag = '<base href="./init/">';
        if (html.includes('<head')) {
            html = html.replace(/<head[^>]*>/i, `$&${baseTag}`);
        } else {
            html = `${baseTag}${html}`;
        }
        
        htmlCache.current[url] = html;
        
        if (isMounted) {
          setGameHtml(html);
          setIsLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (isMounted) {
          setGameHtml('<div style="color:white;display:flex;height:100%;justify-content:center;align-items:center;font-family:monospace;">SYSTEM FAILURE.</div>');
          setIsLoading(false);
        }
      }
    };
    
    loadGame();

    return () => {
      isMounted = false;
    };
  }, [activeModel]);

  const handleRemixAction = async (modification: string) => {
    if (!gameHtml) return;

    setIsLoading(true);
    setLoadingText('TRANSFORMING AESTHETIC...');
    setShowRemix(false); 

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const modelId = activeModel === 'gemini3' ? 'gemini-3-pro-preview' : 'gemini-2.5-pro';
        const currentPrompt = PROMPTS[activeModel as keyof typeof PROMPTS];

        const systemInstruction = `
You are a Creative Coder specializing in ASCII/TUI generative art and aesthetic experiences.
Your task is to modify the provided code based on the user's transformation request.
Output ONLY the raw HTML code.
Ensure the visual style remains ASCII/Text-based.
The theme is meditative, contemplative visual experiences - NOT games or tests.
Focus on beauty, atmosphere, and hypnotic motion. Remove any scores, objectives, or competitive elements.
IMPORTANT: Preserve the following script snippet exactly as it is:
<script>
window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'PAUSE_GAME') {
    if (typeof state !== 'undefined' && state.hasOwnProperty('isPaused')) {
       state.isPaused = e.data.payload;
    } else if (typeof isPaused !== 'undefined') {
       isPaused = e.data.payload;
    }
  }
});
</script>
`;

        const response = await ai.models.generateContent({
            model: modelId,
            config: {
                systemInstruction: systemInstruction
            },
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: `ORIGINAL PROMPT CONTEXT:\n${currentPrompt}` },
                        { text: `CURRENT SOURCE CODE:\n${gameHtml}` },
                        { text: `REMIX INSTRUCTION: Apply this modification to the game: "${modification}". Keep it a single HTML file.` }
                    ]
                }
            ]
        });

        let text = response.text;
        text = text.replace(/^```html\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
        
        const baseTag = '<base href="./init/">';
        if (!text.includes('<base') && !text.includes('init/')) {
             if (text.includes('<head')) {
                text = text.replace(/<head[^>]*>/i, `$&${baseTag}`);
            }
        }
        
        setGameHtml(text);

    } catch (error) {
        console.error("Remix failed", error);
        alert("Remix failed. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleIFrameLoad = () => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow && showDisclaimer) {
      iframe.contentWindow.postMessage({ type: 'PAUSE_GAME', payload: true }, '*');
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; background: #000; }
        ::-webkit-scrollbar-thumb { background: #333; border: 1px solid #555; }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <div style={{display:'flex', alignItems:'center'}}>
           <div style={styles.headerTitle}>AJAYU: AESTHETIC ENGINE</div>
           <div style={styles.buttonGroup}>
            <button
                style={styles.button(activeModel === 'gemini2p5')}
                onClick={() => switchModel('gemini2p5')}
            >
                [ DUALISM ]
            </button>
            <button
                style={styles.button(activeModel === 'gemini3')}
                onClick={() => switchModel('gemini3')}
            >
                [ FLOW FIELD ]
            </button>
            </div>
        </div>

        <div style={styles.buttonGroup}>
          <button
            style={styles.button(showPrompt)}
            onClick={() => setShowPrompt(true)}
          >
            [ VISION ]
          </button>
          <button
            style={styles.button(showRemix)}
            onClick={() => setShowRemix(true)}
          >
            [ TRANSFORM ]
          </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div style={styles.gameWrapper}>
        {(isLoading || !gameHtml) && (
          <div style={styles.loadingContainer}>
            <div style={styles.asciiLoader}>
{`
 [ WEAVING PATTERNS ]
   ∞    ∞    ∞
  ·   · ·   · ·   ·
  ~~~~~  ~~~~~  ~~~~~
  '   '  '   '  '   '
`}
            </div>
            <div style={{animation: 'blink 1s step-end infinite'}}>{loadingText}</div>
          </div>
        )}

        {!isLoading && gameHtml && (
          <iframe 
            ref={iframeRef}
            key={activeModel + gameHtml.length}
            srcDoc={gameHtml}
            style={styles.iframe} 
            title="Game Canvas"
            sandbox="allow-scripts allow-pointer-lock allow-same-origin allow-forms"
            onLoad={handleIFrameLoad}
          />
        )}
      </div>

      {/* Disclaimer / Intro Modal */}
      {showDisclaimer && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>:: WELCOME TO AJAYU ::</div>
            <div style={styles.modalSub}>
              <p><strong>[ EXPERIENCE ]</strong> Generative ASCII Flow Field</p>
              <p><strong>[ INTENTION ]</strong> Pure visual meditation - no goals, no scores.</p>
              <p><strong>[ VISUAL LANGUAGE ]</strong></p>
              <ul style={{listStyleType: 'none', paddingLeft: '10px'}}>
                <li style={{color:'#FFD700'}}>■ GOLD: Energy / Convergence</li>
                <li style={{color:'#1E90FF'}}>■ BLUE: Calm / Low Intensity</li>
                <li style={{color:'#FF4500'}}>■ RED: Turbulence / Divergence</li>
              </ul>
              <p>Move your cursor to subtly influence the field. Or simply observe.</p>
              <p style={{fontSize: '11px', color: '#666', marginTop: '16px'}}>This is a space for contemplation, not competition.</p>
            </div>
            <button style={styles.closeBtn} onClick={() => setShowDisclaimer(false)}>
              [ ENTER ]
            </button>
          </div>
        </div>
      )}

      {/* Prompt Modal */}
      {showPrompt && (
        <div style={styles.modalOverlay} onClick={() => setShowPrompt(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>:: AESTHETIC VISION ::</div>
            <div style={styles.promptBox}>
              {PROMPTS[activeModel as keyof typeof PROMPTS]}
            </div>
            <button style={styles.closeBtn} onClick={() => setShowPrompt(false)}>[ CLOSE ]</button>
          </div>
        </div>
      )}

      {/* Remix Modal */}
      {showRemix && (
        <div style={styles.modalOverlay} onClick={() => setShowRemix(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>:: TRANSFORM EXPERIENCE ::</div>

            {[
                {label: 'Increase Turbulence', icon: '~', desc: 'Add chaotic energy to the flow field.'},
                {label: 'Slow Motion', icon: '∞', desc: 'Reduce speed for deeper contemplation.'},
                {label: 'Invert Flow', icon: '↔', desc: 'Reverse the direction of movement.'},
                {label: 'Add Particles', icon: '·', desc: 'Introduce drifting particle elements.'},
                {label: 'Pulse Rhythm', icon: '♥', desc: 'Create breathing, rhythmic patterns.'}
            ].map((item, i) => (
               <div
                key={item.label}
                style={styles.remixItem}
                onMouseEnter={e => e.currentTarget.style.background = '#222'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={() => handleRemixAction(item.label)}
              >
                <div style={styles.remixIcon}>[{item.icon}]</div>
                <div>
                  <div style={{fontWeight: 'bold'}}>{item.label}</div>
                  <div style={{fontSize: '11px', color: '#888'}}>{item.desc}</div>
                </div>
              </div>
            ))}

            <button style={styles.closeBtn} onClick={() => setShowRemix(false)}>[ CLOSE ]</button>
          </div>
        </div>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById('root') || document.body);
root.render(<App />);