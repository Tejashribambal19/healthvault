// src/controllers/chatbot.controller.js
const { supabaseAdmin } = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

// ─── Symptom Knowledge Base (Rule-Based Engine) ───────────────
const SYMPTOM_KB = {
  fever: {
    keywords: ['fever', 'high temperature', 'chills', 'sweating', 'hot'],
    causes: ['Viral infections (flu, COVID-19)', 'Bacterial infections', 'Urinary tract infections', 'Malaria (if recently traveled)'],
    advice: ['Rest and stay hydrated (drink 8-10 glasses of water)', 'Take paracetamol/acetaminophen for fever above 38.5°C', 'Monitor temperature every 4-6 hours', 'Apply cool, damp cloth on forehead'],
    see_doctor_if: ['Fever above 39.5°C (103°F)', 'Fever lasting more than 3 days', 'Accompanied by severe headache or stiff neck', 'Child under 3 months with any fever'],
    severity: 'moderate',
  },
  headache: {
    keywords: ['headache', 'head pain', 'migraine', 'head ache', 'throbbing head'],
    causes: ['Tension headache (stress, poor posture)', 'Dehydration', 'Migraine', 'Sinusitis', 'Eye strain'],
    advice: ['Rest in a quiet, dark room', 'Drink water — dehydration is a common cause', 'Try OTC pain relievers (paracetamol, ibuprofen)', 'Cold or warm compress on forehead/neck', 'Avoid screen time'],
    see_doctor_if: ['Sudden severe "thunderclap" headache', 'Headache with vision changes, confusion, or weakness', 'Worsening headache over days', 'Headache after head injury'],
    severity: 'low',
  },
  chest_pain: {
    keywords: ['chest pain', 'chest tightness', 'heart pain', 'chest pressure', 'chest ache'],
    causes: ['Cardiac causes (angina, heart attack)', 'Acid reflux/GERD', 'Muscle strain', 'Anxiety/panic attack', 'Pleurisy'],
    advice: ['STOP ACTIVITY immediately and sit/lie down', 'If sudden severe chest pain — CALL EMERGENCY (112/911)', 'Do NOT drive yourself to hospital', 'Loosen tight clothing'],
    see_doctor_if: ['Any chest pain — consult doctor urgently', 'Radiating pain to arm, jaw, back', 'Pain with sweating, nausea, or shortness of breath', 'Pain lasting more than a few minutes'],
    severity: 'high',
    emergency: true,
  },
  cough: {
    keywords: ['cough', 'coughing', 'dry cough', 'wet cough', 'coughing up'],
    causes: ['Viral respiratory infection (cold, flu)', 'Allergies or asthma', 'COVID-19', 'Postnasal drip', 'GERD'],
    advice: ['Stay hydrated with warm liquids (honey, ginger tea)', 'Use a humidifier', 'Elevate head while sleeping', 'Avoid irritants (smoke, dust, cold air)', 'OTC cough syrups for symptom relief'],
    see_doctor_if: ['Coughing blood', 'Persistent cough over 3 weeks', 'Cough with high fever or chest pain', 'Difficulty breathing or wheezing'],
    severity: 'low',
  },
  abdominal_pain: {
    keywords: ['stomach pain', 'abdominal pain', 'belly pain', 'stomach ache', 'tummy pain', 'nausea', 'vomiting'],
    causes: ['Gastritis or GERD', 'Food poisoning', 'Appendicitis (right lower pain)', 'IBS', 'Kidney stones'],
    advice: ['Avoid solid foods temporarily, take clear fluids', 'Rest and apply heat pad to stomach', 'Avoid spicy/fatty foods', 'OTC antacids for acidity-related pain'],
    see_doctor_if: ['Severe pain that does not improve in 1-2 hours', 'Rigid or board-like abdomen', 'Pain with fever and vomiting', 'Pain in pregnant women'],
    severity: 'moderate',
  },
  breathlessness: {
    keywords: ['shortness of breath', 'breathlessness', 'difficulty breathing', 'can\'t breathe', 'labored breathing'],
    causes: ['Asthma or COPD', 'Anxiety or panic attack', 'Anemia', 'Heart failure', 'Pneumonia'],
    advice: ['Sit upright to ease breathing', 'If known asthmatic — use rescue inhaler', 'Avoid lying flat', 'Stay calm and breathe slowly'],
    see_doctor_if: ['Sudden severe breathlessness — EMERGENCY', 'Breathlessness at rest', 'Blue lips or fingertips (cyanosis)', 'Breathlessness with chest pain'],
    severity: 'high',
    emergency: true,
  },
  dizziness: {
    keywords: ['dizzy', 'dizziness', 'vertigo', 'lightheaded', 'spinning', 'fainting'],
    causes: ['Dehydration', 'Low blood pressure (orthostatic hypotension)', 'Inner ear problems (BPPV)', 'Anemia', 'Low blood sugar'],
    advice: ['Sit or lie down immediately to prevent falls', 'Drink water or juice', 'Avoid sudden position changes (sit before standing)', 'Eat something if you haven\'t eaten recently'],
    see_doctor_if: ['Dizziness with sudden headache or vision changes', 'Fainting or loss of consciousness', 'Dizziness after head injury', 'Persistent dizziness'],
    severity: 'moderate',
  },
  joint_pain: {
    keywords: ['joint pain', 'arthritis', 'knee pain', 'back pain', 'body ache', 'muscle pain'],
    causes: ['Arthritis (osteoarthritis or rheumatoid)', 'Muscle strain or overuse', 'Viral fever (dengue, chikungunya)', 'Gout', 'Sports injury'],
    advice: ['Rest the affected joint', 'Apply ice (first 48 hrs) then heat', 'OTC anti-inflammatory (ibuprofen)', 'Gentle stretching and warm water bath', 'Elevate if swollen'],
    see_doctor_if: ['Severe swelling with redness and warmth', 'Joint locked in position', 'Multiple joints affected with fever', 'Joint pain after injury'],
    severity: 'low',
  },
};

// ─── Analyze Symptoms ─────────────────────────────────────────
const analyzeSymptoms = (message) => {
  const lowerMsg = message.toLowerCase();
  const matched = [];

  for (const [condition, data] of Object.entries(SYMPTOM_KB)) {
    if (data.keywords.some(k => lowerMsg.includes(k))) {
      matched.push({ condition, ...data });
    }
  }

  return matched;
};

// ─── Format Chatbot Response ──────────────────────────────────
const formatResponse = (matchedConditions, originalMessage) => {
  if (matchedConditions.length === 0) {
    return {
      response: `I understand you may be experiencing some health concerns. However, I couldn't identify specific symptoms from your message.

Please describe your symptoms more specifically, such as:
• "I have a fever and headache"
• "I have chest pain and shortness of breath"
• "I have stomach pain and nausea"

**Remember**: This chatbot provides general health information only and is NOT a substitute for professional medical advice.`,
      has_emergency: false,
    };
  }

  // Check for emergency
  const hasEmergency = matchedConditions.some(c => c.emergency);

  let response = '';

  if (hasEmergency) {
    response += `🚨 **EMERGENCY WARNING**\n\nBased on your symptoms, you may need **immediate medical attention**.\n\n**Please call 112 (India) / 911 or go to the nearest emergency room immediately.**\n\n---\n\n`;
  }

  if (matchedConditions.length === 1) {
    const c = matchedConditions[0];
    response += `Based on your symptoms, here is some information:\n\n`;
    response += `**Possible Causes:**\n${c.causes.map(x => `• ${x}`).join('\n')}\n\n`;
    response += `**General Advice:**\n${c.advice.map(x => `• ${x}`).join('\n')}\n\n`;
    response += `**See a Doctor If:**\n${c.see_doctor_if.map(x => `• ${x}`).join('\n')}\n\n`;
  } else {
    response += `Based on your symptoms, I found information about multiple conditions:\n\n`;
    matchedConditions.forEach((c, i) => {
      const label = c.condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      response += `**${i + 1}. ${label}:**\n`;
      response += `Possible causes: ${c.causes.slice(0, 2).join(', ')}\n\n`;
    });
    response += `**General Advice:**\n`;
    const allAdvice = [...new Set(matchedConditions.flatMap(c => c.advice))].slice(0, 4);
    response += allAdvice.map(x => `• ${x}`).join('\n') + '\n\n';
    response += `**See a Doctor If Any of These Apply:**\n`;
    const allWarnings = [...new Set(matchedConditions.flatMap(c => c.see_doctor_if))].slice(0, 5);
    response += allWarnings.map(x => `• ${x}`).join('\n') + '\n\n';
  }

  response += `---\n\n⚕️ **DISCLAIMER**: This information is for educational purposes only and does NOT constitute medical diagnosis or professional medical advice. Always consult a qualified healthcare professional for diagnosis and treatment.`;

  return { response, has_emergency: hasEmergency };
};

// ─── POST /api/chatbot/message ────────────────────────────────
const sendMessage = async (req, res, next) => {
  try {
    const { message, session_id } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const sessionId = session_id || uuidv4();

    // Analyze symptoms
    const matchedConditions = analyzeSymptoms(message);
    const { response, has_emergency } = formatResponse(matchedConditions, message);

    // Save chat history if user is logged in
    if (req.user) {
      const chatRows = [
        { user_id: req.user.id, session_id: sessionId, role: 'user',      message },
        { user_id: req.user.id, session_id: sessionId, role: 'assistant', message: response,
          metadata: { matched_conditions: matchedConditions.map(c => c.condition), has_emergency }
        }
      ];
      await supabaseAdmin.from('chat_history').insert(chatRows);
    }

    res.json({
      response,
      session_id: sessionId,
      has_emergency,
      matched_conditions: matchedConditions.map(c => ({
        condition: c.condition,
        severity: c.severity
      })),
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/chatbot/history ─────────────────────────────────
const getChatHistory = async (req, res, next) => {
  try {
    const { session_id, limit = 50 } = req.query;

    let query = supabaseAdmin
      .from('chat_history')
      .select('id, session_id, role, message, metadata, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true })
      .limit(parseInt(limit));

    if (session_id) query = query.eq('session_id', session_id);

    const { data: history, error } = await query;
    if (error) throw error;

    res.json({ history, session_id });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/chatbot/sessions ────────────────────────────────
const getChatSessions = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('chat_history')
      .select('session_id, created_at, message')
      .eq('user_id', req.user.id)
      .eq('role', 'user')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by session
    const sessions = {};
    data.forEach(row => {
      if (!sessions[row.session_id]) {
        sessions[row.session_id] = {
          session_id: row.session_id,
          first_message: row.message.substring(0, 60) + '...',
          created_at: row.created_at,
        };
      }
    });

    res.json({ sessions: Object.values(sessions) });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendMessage, getChatHistory, getChatSessions };
