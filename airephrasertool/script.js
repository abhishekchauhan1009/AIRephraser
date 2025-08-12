document.getElementById('rephraseBtn').addEventListener('click', generateRephrases);

async function generateRephrases() {
  const userMessage = document.getElementById('userMessage').value.trim();
  if (!userMessage) { alert('Please enter a message!'); return; }

  const apiKey = "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";
  const resultsEl = document.getElementById('results');
  resultsEl.innerHTML = '<p>⏳ Rephrasing...</p>';

  const prompt = `You are an expert communication assistant. The user will provide a WhatsApp message. 
Rephrase it in exactly 3 versions:  

1. Formal : Professional, respectful tone for workplace or official use.  
2. Polite : Friendly, courteous tone without sounding too stiff.  
3. Casual : Relaxed and informal, as if texting a close friend.  

Do not change the meaning or add new information.  

User's message: "${userMessage}"`;

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 400
      })
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error('API error', resp.status, txt);
      resultsEl.innerHTML = `<p style="color:darkred">API error: ${resp.status} ${resp.statusText}</p>`;
      return;
    }

    const data = await resp.json();
    const outputText = data.choices?.[0]?.message?.content ?? String(data);

    
    let sections = outputText.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
    if (sections.length < 3) sections = outputText.split(/\n(?=\d+\.)/).map(s => s.trim()).filter(Boolean);
    if (sections.length < 1) sections = outputText.split(/\r?\n/).map(s => s.trim()).filter(Boolean);


    resultsEl.innerHTML = '';
    sections.forEach((sec, idx) => {
      const box = document.createElement('div');
      box.className = 'output-box';

      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.type = 'button';
      btn.title = 'Copy text inside quotes';
      btn.setAttribute('aria-label', 'Copy quoted text');
      btn.innerHTML = /* copy SVG */ `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zM8 7h11v14H8V7z"/>
        </svg>`;

      const textDiv = document.createElement('div');
      textDiv.className = 'output-text';
      textDiv.textContent = sec;

      btn.addEventListener('click', async () => {
        const fullText = textDiv.textContent || '';
        const match = fullText.match(/([""''])([\s\S]*?)\1/);
        const toCopy = match ? match[2].trim() : fullText.trim();

        const ok = await copyToClipboard(toCopy);
        if (ok) {
          btn.classList.add('copied');
          setTimeout(() => btn.classList.remove('copied'), 1400);
        } else {
          alert('Copy failed — please try manually.');
        }
      });

      box.appendChild(btn);
      box.appendChild(textDiv);
      resultsEl.appendChild(box);
    });

  } catch (err) {
    console.error(err);
    resultsEl.innerHTML = '<p style="color:darkred">Error generating response — see console for details.</p>';
  }
}

async function copyToClipboard(text) {
  if (!text) return false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    console.warn('navigator.clipboard.writeText failed', e);
  }

  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return !!ok;
  } catch (e) {
    console.warn('fallback copy failed', e);
    return false;
  }
}
document.getElementById('resetBtn').addEventListener('click', resetForm);

function resetForm() {

  document.getElementById('userMessage').value = '';

  document.getElementById('results').innerHTML = '';
  
  const generateBtn = document.getElementById('rephraseBtn');
  generateBtn.disabled = false;
  generateBtn.textContent = 'Generate Rephrase';
  
  document.getElementById('userMessage').focus();
}
