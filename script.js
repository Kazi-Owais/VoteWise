let userPersona = 'first-time'; 
let explanationMode = 'simple'; 
const SHEET_ID = '1EkQrNw4ZR1YO0d0l_3j_D4HBCjkJrzrIID0HH89peH4'; 

// Local Backup Data (If Google Sheets Sync Fails)
const localBackup = {
    content: [
        { SectionID: 'guide', Persona: 'first-time', Mode: 'simple', Text: "1. Register. 2. Find polling place. 3. Vote." },
        { SectionID: 'guide', Persona: 'first-time', Mode: 'detailed', Text: "1. Registration: Ensure you're on the voter rolls by Oct 15. 2. Research: Look up your local ballot. 3. Polling: Find your station." },
        { SectionID: 'register', Persona: 'first-time', Mode: 'simple', Text: "Start your registration today." }
    ],
    timeline: [
        { Date: "Oct 15", Event: "Registration Deadline", Status: "current", SimpleDesc: "Register now.", DetailedDesc: "Last day for online registration." },
        { Date: "Nov 3", Event: "Election Day", Status: "upcoming", SimpleDesc: "Vote today!", DetailedDesc: "Polls open 7 AM to 8 PM." }
    ],
    booths: [
        { Name: "City Library", Distance: "0.5mi" },
        { Name: "Community Center", Distance: "1.2mi" }
    ]
};

let appData = { content: [], timeline: [], booths: [] };

/**
 * Fetch data from Google Sheets (Live Backend)
 */
async function fetchAppData() {
    const loader = document.createElement('div');
    loader.id = 'app-loader';
    loader.innerHTML = '<div style="position: fixed; inset: 0; background: rgba(255,255,255,0.9); z-index: 3000; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 700;">🔄 Synchronizing...</div>';
    document.body.appendChild(loader);

    try {
        const tabs = ['Content', 'Timeline', 'Booths'];
        const results = await Promise.all(tabs.map(tab => 
            fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${tab}`)
                .then(res => res.text())
                .then(text => {
                    const json = JSON.parse(text.substring(47, text.length - 2));
                    return json.table.rows.map(row => {
                        const obj = {};
                        json.table.cols.forEach((col, i) => {
                            obj[col.label || `col${i}`] = row.c[i] ? row.c[i].v : null;
                        });
                        return obj;
                    });
                })
        ));

        appData.content = results[0];
        appData.timeline = results[1];
        appData.booths = results[2];
        console.log('✅ Live Data Loaded');
    } catch (err) {
        console.warn('⚠️ Sync Failed (Likely CORS). Using Local Backup.');
        appData = localBackup;
    } finally {
        if (loader) loader.remove();
        switchSection('eligibility', document.querySelector('.nav-card.active'));
    }
}

const sections = {
    eligibility: {
        title: "Eligibility Checker",
        getContent: (persona, mode) => {
            const extra = mode === 'detailed' ? "<p style='font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;'>In most jurisdictions, you must also be a citizen and meet residency requirements.</p>" : "";
            return `
                <div class="logic-container" style="display: flex; flex-direction: column; gap: 1.5rem;">
                    <p>Find out if you are ready to vote by entering your age.</p>
                    ${extra}
                    <div style="display: flex; gap: 1rem; align-items: flex-end;">
                        <input type="number" id="age-input" placeholder="Your Age" style="flex: 1; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 0.5rem;">
                        <button onclick="checkEligibility()" style="padding: 0.75rem 1.5rem; background: var(--primary); color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer;">Check</button>
                    </div>
                    <div id="eligibility-result" style="margin-top: 1rem;"></div>
                </div>
            `;
        }
    },
    guide: {
        title: "Voting Guide",
        getContent: (persona, mode) => {
            const row = appData.content.find(r => r.SectionID === 'guide' && r.Persona === persona && r.Mode === mode);
            return `
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <p>Mode: <strong>${mode.toUpperCase()}</strong></p>
                    <div style="padding: 1.5rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; line-height: 1.8;">
                        ${row ? row.Text : "Syncing details from Google Sheets..."}
                    </div>
                </div>
            `;
        }
    },
    timeline: {
        title: "Election Timeline",
        getContent: (persona, mode) => {
            if (appData.timeline.length === 0) return "<p>Syncing timeline...</p>";
            return `
                <div class="timeline-v" style="border-left: 2px dashed #cbd5e1; margin-left: 1rem; padding-left: 2.5rem; display: flex; flex-direction: column; gap: 2.5rem; position: relative;">
                    ${appData.timeline.map((e, i) => `
                        <div class="t-node" style="position: relative;">
                            <div style="position: absolute; left: -3.05rem; top: 0.25rem; width: 16px; height: 16px; border-radius: 50%; 
                                background: ${e.Status === 'completed' ? '#059669' : (e.Status === 'current' ? 'var(--primary)' : 'white')}; 
                                border: 3px solid ${e.Status === 'upcoming' ? '#cbd5e1' : (e.Status === 'current' ? 'var(--primary)' : '#059669')};"></div>
                            <div style="font-size: 0.85rem; font-weight: 700; color: var(--primary); margin-bottom: 0.25rem;">${e.Date}</div>
                            <h4 style="font-weight: 800;">${e.Event}</h4>
                            <p style="font-size: 0.9rem; color: #64748b;">${mode === 'detailed' ? e.DetailedDesc : e.SimpleDesc}</p>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    },
    register: {
        title: "Registration",
        getContent: (persona, mode) => {
            const row = appData.content.find(r => r.SectionID === 'register' && r.Persona === persona && r.Mode === mode);
            return `
                <div style="text-align: center;">
                    <p style="margin-bottom: 2rem;">${row ? row.Text : "Start your registration today."}</p>
                    <button style="padding: 1rem 2rem; background: var(--primary); color: white; border: none; border-radius: 0.5rem; font-weight: 700; cursor: pointer;">Open Government Portal</button>
                </div>
            `;
        }
    },
    pollingBooth: {
        title: "Find Booth",
        getContent: (persona, mode) => `
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <p>Locate the nearest community center assigned to your ward.</p>
                <div id="mock-booths" style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <strong>Recommended Locations:</strong>
                    ${appData.booths.map(b => `<div style="font-size: 0.85rem; padding: 0.5rem; background: #eee; border-radius: 0.3rem;">${b.Name} (${b.Distance})</div>`).join('')}
                </div>
            </div>
        `
    }
};

function setStyle(mode) {
    explanationMode = mode;
    document.querySelectorAll('.style-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${mode}`).classList.add('active');
    const activeSection = document.querySelector('.nav-card.active');
    const sectionId = activeSection.getAttribute('onclick').match(/'([^']+)'/)[1];
    switchSection(sectionId, activeSection);
}

function selectPersona(type) {
    userPersona = type;
    document.getElementById('persona-overlay').style.display = 'none';
    fetchAppData();
    setTimeout(() => {
        const greetings = { 'first-time': "Welcome! I've simplified the process.", 'student': "Hi! Campus info ready.", 'professional': "Hello. Options optimized." };
        appendMessage('bot', greetings[type]);
    }, 1000);
}

function showBoothError(msg) {
    document.getElementById('booth-results').innerHTML = `<div style="padding: 1rem; background: #fdf2f2; color: #9b1c1c;">${msg}</div>`;
}

function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function switchSection(id, element) {
    document.querySelectorAll('.nav-card').forEach(card => card.classList.remove('active'));
    element.classList.add('active');
    const contentArea = document.getElementById('content-display');
    const section = sections[id];
    contentArea.innerHTML = `
        <div style="animation: fadeIn 0.3s ease;">
            <h2>${section.title}</h2>
            ${section.getContent(userPersona, explanationMode)}
            <p style="margin-top: 2rem; font-size: 0.75rem; color: var(--text-muted); border-top: 1px solid #eee; padding-top: 1rem;">🛡️ Local Privacy Protected.</p>
        </div>
    `;
    lucide.createIcons();
    window.scrollTo({ top: contentArea.offsetTop - 50, behavior: 'smooth' });
}

function checkEligibility() {
    const ageInput = document.getElementById('age-input');
    const rawAge = ageInput.value.trim();
    if (rawAge === "" || !/^\d+$/.test(rawAge)) {
        showResult("error", "⚠️ Use numbers only.");
        return;
    }
    const ageNum = parseInt(rawAge, 10);
    if (ageNum >= 18) showResult("success", "✅ Eligible!");
    else showResult("warning", `❌ Not yet. ${18 - ageNum} years left.`);
}

function showResult(type, message) {
    const colors = { success: { bg: '#def7ec', text: '#03543f' }, warning: { bg: '#fdf2f2', text: '#9b1c1c' }, error: { bg: '#fdf2f2', text: '#9b1c1c' } };
    document.getElementById('eligibility-result').innerHTML = `<div style="padding: 1rem; background: ${colors[type].bg}; color: ${colors[type].text}; border-radius: 0.5rem;">${message}</div>`;
}

function handleChatKey(e) { if (e.key === 'Enter') sendMessage(); }
function sendSuggestion(text) { document.getElementById('user-input').value = text; sendMessage(); }

function sendMessage() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (!text) return;
    appendMessage('user', sanitize(text));
    input.value = '';
    const typingId = showTypingIndicator();
    setTimeout(() => {
        removeTypingIndicator(typingId);
        appendMessage('bot', getMockResponse(text));
    }, 1200);
}

function appendMessage(sender, text) {
    const messages = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    div.innerHTML = text;
    messages.appendChild(div);
    scrollToBottom();
}

function showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.className = 'message bot typing-message';
    div.id = id;
    div.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
    document.getElementById('chat-messages').appendChild(div);
    scrollToBottom();
    return id;
}

function removeTypingIndicator(id) { const el = document.getElementById(id); if (el) el.remove(); }
function scrollToBottom() { const mes = document.getElementById('chat-messages'); mes.scrollTo({ top: mes.scrollHeight, behavior: 'smooth' }); }

function getMockResponse(query) {
    query = query.toLowerCase();
    const rules = [
        { keywords: ['vote', 'how'], responses: { 'first-time': { simple: "Register and vote!", detailed: "Check guidelines." } } },
        { keywords: ['eligible', 'age'], responses: { 'first-time': { simple: "18+ and citizen.", detailed: "See checker." } } }
    ];
    for (const rule of rules) {
        if (rule.keywords.some(k => query.includes(k))) return rule.responses['first-time']['simple'];
    }
    return "Ask about registration or eligibility!";
}

function toggleChat() {
    const chat = document.getElementById('chat');
    const toggleBtn = document.getElementById('chat-toggle');
    chat.classList.toggle('active');
    if(chat.classList.contains('active')) {
        toggleBtn.style.display = 'none';
        setTimeout(scrollToBottom, 300);
    } else {
        toggleBtn.style.display = 'flex';
    }
}
