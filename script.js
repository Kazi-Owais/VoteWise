// VoteWise Application Logic (Classic Mode)

const firebaseConfig = {
  apiKey: "AIzaSyBeYPpLVxJorUZEedSevx4jn2Ym3wLOkr8",
  authDomain: "coffee-spark-sample-app-576e1.firebaseapp.com",
  projectId: "coffee-spark-sample-app-576e1",
  storageBucket: "coffee-spark-sample-app-576e1.firebasestorage.app",
  messagingSenderId: "398795286248",
  appId: "1:398795286248:web:f3ccceb157fb2827c7cb5d"
};

// Initialize Firebase (Compat/Classic)
let db = null;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
} catch (e) {
    console.warn("Firebase offline or blocked by browser.");
}

let userPersona = 'first-time'; 
let explanationMode = 'simple'; 
const SHEET_ID = '1EkQrNw4ZR1YO0d0l_3j_D4HBCjkJrzrIID0HH89peH4'; 

// --- REAL FIREBASE TRACKING ---
async function trackEvent(category, action) {
    console.log(`📊 [Firebase Event] Category: ${category}, Action: ${action}`);
    if (!db) return;
    try {
        await db.collection("interactions").add({
            category: category,
            action: action,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            persona: userPersona
        });
    } catch (e) {
        console.warn("Firebase tracking failed:", e);
    }
}

// Local Backup Data (If Google Sheets Sync Fails)
const localBackup = {
    content: [
        // FIRST-TIME VOTER
        { SectionID: 'guide', Persona: 'first-time', Mode: 'simple', Text: "1. Register by Oct 15. 2. Find your station. 3. Carry your ID." },
        { SectionID: 'guide', Persona: 'first-time', Mode: 'detailed', Text: "<strong>Comprehensive Guide:</strong> First, ensure you are on the electoral roll by checking the official portal. Research your local candidates' manifestos. On election day, bring a valid photo ID (Driver's License or Passport) to your assigned station between 7 AM and 8 PM." },
        { SectionID: 'register', Persona: 'first-time', Mode: 'simple', Text: "New voter registration portal is open." },
        { SectionID: 'register', Persona: 'first-time', Mode: 'detailed', Text: "You must complete the Form 6 for new registration. Ensure you have a digital passport-size photo and proof of address (electricity bill or rent agreement) ready before starting." },
        
        // STUDENT
        { SectionID: 'guide', Persona: 'student', Mode: 'simple', Text: "1. Check campus residency rules. 2. Use Student ID. 3. Vote early." },
        { SectionID: 'guide', Persona: 'student', Mode: 'detailed', Text: "<strong>Student Protocol:</strong> Most states allow students to register using either their campus or home address. If voting on campus, ensure your University ID is an approved form of identification. We recommend voting during 'Early Voting' windows to avoid mid-term exam clashes." },
        { SectionID: 'register', Persona: 'student', Mode: 'simple', Text: "Register via your University portal link." },
        { SectionID: 'register', Persona: 'student', Mode: 'detailed', Text: "Students away from home should request an 'Absentee Ballot' at least 30 days before the election. Check if your university has an on-campus registration drive this week." },

        // PROFESSIONAL
        { SectionID: 'guide', Persona: 'professional', Mode: 'simple', Text: "1. Skip queues with Early Voting. 2. Mail-in Ballot. 3. 5-min process." },
        { SectionID: 'guide', Persona: 'professional', Mode: 'detailed', Text: "<strong>Executive Summary:</strong> For maximum efficiency, we suggest utilizing the 'Mail-in' ballot option. If voting in person, the 10 AM to 12 PM window is typically the least crowded. Registered professionals can often access 'Fast-Pass' lanes at major urban polling hubs." },
        { SectionID: 'register', Persona: 'professional', Mode: 'simple', Text: "Fast-track online registration for working citizens." },
        { SectionID: 'register', Persona: 'professional', Mode: 'detailed', Text: "Use the 'Express Registration' portal which syncs with your tax ID for faster verification. Ensure your employer allows for the mandatory 'Voter Leave' provided by law." }
    ],
    timeline: [
        { Date: "Oct 15", Event: "Registration Deadline", Status: "current", SimpleDesc: "Register now.", DetailedDesc: "Last day for online and mail-in registration." },
        { Date: "Nov 3", Event: "Election Day", Status: "upcoming", SimpleDesc: "Vote today!", DetailedDesc: "Polls open 7 AM to 8 PM. Check your local station for peak hours." }
    ],
    booths: [
        { Name: "City Library", Distance: "0.5mi" },
        { Name: "Community Center", Distance: "1.2mi" }
    ]
};

let appData = { content: [], timeline: [], booths: [] };

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
            // Check Live Data first, then Local Backup
            const row = appData.content.find(r => r.SectionID === 'guide' && r.Persona === persona && r.Mode === mode) ||
                        localBackup.content.find(r => r.SectionID === 'guide' && r.Persona === persona && r.Mode === mode);
            
            return `
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <p>Mode: <strong>${mode.toUpperCase()}</strong></p>
                    <div style="padding: 1.5rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; line-height: 1.8;">
                        ${row ? row.Text : "Voting details are being prepared for your persona."}
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
            const row = appData.content.find(r => r.SectionID === 'register' && r.Persona === persona && r.Mode === mode) ||
                        localBackup.content.find(r => r.SectionID === 'register' && r.Persona === persona && r.Mode === mode);
            
            return `
                <div style="text-align: center;">
                    <p style="margin-bottom: 2rem;">${row ? row.Text : "Start your registration today."}</p>
                    <button onclick="window.open('https://vote.gov', '_blank')" style="padding: 1rem 2rem; background: var(--primary); color: white; border: none; border-radius: 0.5rem; font-weight: 700; cursor: pointer;">Open Government Portal</button>
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

function getConnectedAdvice() {
    const nearest = appData.booths[0] || localBackup.booths[0];
    const deadline = appData.timeline.find(t => t.Status === 'current') || localBackup.timeline[0];
    
    // Remote Voting Link for Students/Pros
    const remoteLink = (userPersona === 'student' || userPersona === 'professional') 
        ? `<li>📮 <strong>Remote Voting:</strong> <a href="https://www.vote.org/absentee-ballot/" target="_blank" style="color: var(--primary); font-weight: 700;">Request Absentee Ballot</a></li>`
        : "";

    return `
        <div style="margin-top: 1.5rem; padding: 1.25rem; background: #f0f4ff; border: 1px solid #c7d2fe; border-radius: 0.75rem; animation: slideUp 0.4s ease;">
            <h4 style="color: var(--primary); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                Next Steps for You
            </h4>
            <ul style="font-size: 0.9rem; list-style: none; display: flex; flex-direction: column; gap: 0.75rem;">
                <li>📍 <strong>Nearest Booth:</strong> ${nearest.Name} (${nearest.Distance})</li>
                <li>📅 <strong>Current Task:</strong> ${deadline.Event} before ${deadline.Date}</li>
                ${remoteLink}
                <li>🛠️ <strong>Action:</strong> <button onclick="switchSection('register', document.querySelectorAll('.nav-card')[3])" style="background: none; border: none; color: var(--primary); font-weight: 700; cursor: pointer; padding: 0; text-decoration: underline;">Start Registration Now →</button></li>
            </ul>
        </div>
    `;
}

function checkEligibility() {
    const ageInput = document.getElementById('age-input');
    const rawAge = ageInput.value.trim();
    if (rawAge === "" || !/^\d+$/.test(rawAge)) {
        showResult("error", "⚠️ Use numbers only.");
        return;
    }
    const ageNum = parseInt(rawAge, 10);
    if (ageNum >= 18) {
        showResult("success", "✅ <strong>You are eligible!</strong> Here is your personalized plan:");
        document.getElementById('eligibility-result').innerHTML += getConnectedAdvice();
        lucide.createIcons();
        trackEvent('Eligibility', 'Eligible');
    } else {
        showResult("warning", `❌ Not yet. You'll be eligible in ${18 - ageNum} years.`);
        trackEvent('Eligibility', 'Not-Eligible');
    }
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
    trackEvent('Chat', 'Query: ' + query);

    // AI COMMAND LOGIC: Switch UI based on chat input
    if (query.includes('eligible') || query.includes('can i')) {
        setTimeout(() => switchSection('eligibility', document.querySelectorAll('.nav-card')[0]), 800);
        return "I've opened the <strong>Eligibility Checker</strong> for you. Simply enter your age to begin.";
    }
    if (query.includes('booth') || query.includes('where')) {
        setTimeout(() => switchSection('pollingBooth', document.querySelectorAll('.nav-card')[4]), 800);
        return "Switching to the <strong>Booth Locator</strong>. I'll show you the centers closest to your ward.";
    }
    if (query.includes('deadline') || query.includes('when')) {
        setTimeout(() => switchSection('timeline', document.querySelectorAll('.nav-card')[2]), 800);
        return "Opening the <strong>Election Timeline</strong>. Let's look at your upcoming deadlines.";
    }
    if (query.includes('help') || query.includes('guide')) {
        setTimeout(() => switchSection('guide', document.querySelectorAll('.nav-card')[1]), 800);
        return "Sure! Loading your personalized <strong>Voting Guide</strong> now.";
    }

    return "I can help with eligibility, booths, and deadlines. Try asking 'Am I eligible?' or 'Where is my booth?'";
}

function toggleChat() {
    const chat = document.getElementById('chat');
    const toggleBtn = document.getElementById('chat-toggle');
    chat.classList.toggle('active');
    if(chat.classList.contains('active')) {
        toggleBtn.style.display = 'none';
        trackEvent('Chat', 'Widget Opened');
        setTimeout(scrollToBottom, 300);
    } else {
        toggleBtn.style.display = 'flex';
    }
}

// --- GLOBAL EXPOSURE (REQUIRED FOR MODULES) ---
window.selectPersona = selectPersona;
window.setStyle = setStyle;
window.switchSection = switchSection;
window.checkEligibility = checkEligibility;
window.sendMessage = sendMessage;
window.toggleChat = toggleChat;
window.sendSuggestion = sendSuggestion;
window.handleChatKey = handleChatKey;
window.fetchAppData = fetchAppData;
