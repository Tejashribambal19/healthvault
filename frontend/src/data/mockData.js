// src/data/mockData.js

export const RECORDS = [
  { id: 1, name: 'CBC Blood Test — March 2026',    type: 'PDF', category: 'Blood test',         doctor: 'Dr. Arjun Mehta',   date: '18 Mar 2026', size: '1.2 MB', icon: 'pdf', badge: 'badge-red'    },
  { id: 2, name: 'Chest X-Ray Report',             type: 'IMG', category: 'Scan / X-Ray',       doctor: 'Apollo Diagnostics', date: '02 Mar 2026', size: '4.8 MB', icon: 'img', badge: 'badge-blue'   },
  { id: 3, name: 'Diabetes Panel — HbA1c',         type: 'PDF', category: 'Blood test',         doctor: 'Dr. Priya Singh',    date: '14 Feb 2026', size: '0.9 MB', icon: 'pdf', badge: 'badge-red'    },
  { id: 4, name: 'Vitamin D & B12 Report',         type: 'PDF', category: 'Blood test',         doctor: 'Thyrocare Labs',     date: '10 Jan 2026', size: '0.7 MB', icon: 'pdf', badge: 'badge-red'    },
  { id: 5, name: 'Paracetamol Prescription',       type: 'Rx',  category: 'Prescription',       doctor: 'Dr. Arjun Mehta',   date: '18 Mar 2026', size: '120 KB', icon: 'rx',  badge: 'badge-green'  },
  { id: 6, name: 'MRI Brain — Jan 2026',           type: 'IMG', category: 'Scan / X-Ray / MRI', doctor: 'Fortis Radiology',   date: '05 Jan 2026', size: '18.2 MB',icon: 'img', badge: 'badge-blue'  },
  { id: 7, name: 'Discharge Summary — Nov 2025',   type: 'PDF', category: 'Discharge summary',  doctor: 'Kokilaben Hospital', date: '22 Nov 2025', size: '2.1 MB', icon: 'pdf', badge: 'badge-red'    },
]

export const TIMELINE = [
  { date: 'Mar 2026', label: 'CBC Blood Test',       desc: 'Haemoglobin slightly low. Follow-up in 1 month.',  color: 'var(--accent)' },
  { date: 'Mar 2026', label: 'General Consultation', desc: 'Seasonal flu. Paracetamol prescribed.',             color: 'var(--blue)'   },
  { date: 'Feb 2026', label: 'HbA1c Test',           desc: 'HbA1c 5.7% — pre-diabetic range. Diet advised.',   color: 'var(--amber)'  },
  { date: 'Jan 2026', label: 'MRI Scan',             desc: 'No abnormalities detected. Report archived.',      color: 'var(--accent)' },
]

export const ACCESS_PERMISSIONS = [
  { name: 'Dr. Arjun Mehta',  role: 'General Physician', initials: 'AM', avatarClass: 'avatar-blue',   records: 8,  expires: 'Permanent'   },
  { name: 'Dr. Priya Singh',  role: 'Endocrinologist',   initials: 'PS', avatarClass: 'avatar-green',  records: 3,  expires: '14 Apr 2026' },
  { name: 'Dr. R. Iyer',      role: 'Neurologist',       initials: 'RI', avatarClass: 'avatar-orange', records: 2,  expires: '1 Apr 2026'  },
]

export const DOCTOR_PATIENTS = [
  { id: 1, name: 'Riya Sharma',  age: 27, condition: 'Anaemia, Pre-diabetes', lastVisit: '18 Mar 2026', initials: 'RS', avatarClass: 'avatar-green',
    records: [
      { name: 'CBC Blood Test', type: 'PDF', date: '18 Mar 2026', icon: 'pdf' },
      { name: 'HbA1c Report',   type: 'PDF', date: '14 Feb 2026', icon: 'pdf' },
    ]
  },
  { id: 2, name: 'Karan Patel', age: 45, condition: 'Hypertension', lastVisit: '12 Mar 2026', initials: 'KP', avatarClass: 'avatar-blue',
    records: [
      { name: 'ECG Report',      type: 'PDF', date: '12 Mar 2026', icon: 'pdf' },
      { name: 'Chest X-Ray',     type: 'IMG', date: '01 Feb 2026', icon: 'img' },
    ]
  },
  { id: 3, name: 'Meera Joshi', age: 33, condition: 'Thyroid (Hypothyroid)', lastVisit: '05 Mar 2026', initials: 'MJ', avatarClass: 'avatar-orange',
    records: [
      { name: 'TSH Panel Report', type: 'PDF', date: '05 Mar 2026', icon: 'pdf' },
    ]
  },
]

export const PRESCRIPTIONS = [
  { patient: 'Riya Sharma',  meds: 'Paracetamol 500mg, Cetirizine 10mg',  issued: '18 Mar 2026', valid: '25 Mar 2026', status: 'Active'  },
  { patient: 'Karan Patel',  meds: 'Amlodipine 5mg, Atenolol 50mg',       issued: '12 Mar 2026', valid: '12 Apr 2026', status: 'Active'  },
  { patient: 'Meera Joshi',  meds: 'Eltroxin 50mcg',                       issued: '05 Mar 2026', valid: '05 Apr 2026', status: 'Active'  },
  { patient: 'Suresh Nair',  meds: 'Metformin 500mg, Glipizide 5mg',       issued: '28 Feb 2026', valid: '28 Mar 2026', status: 'Expired' },
]

export const USERS_TABLE = [
  { name: 'Riya Sharma',    email: 'riya@email.com',    role: 'patient', joined: '10 Jan 2026', status: 'Active',  records: 14, initials: 'RS', avatarClass: 'avatar-green'  },
  { name: 'Dr. Arjun Mehta',email: 'arjun@apollo.com',  role: 'doctor',  joined: '02 Dec 2025', status: 'Active',  records: 0,  initials: 'AM', avatarClass: 'avatar-blue'   },
  { name: 'Karan Patel',    email: 'karan@email.com',   role: 'patient', joined: '15 Feb 2026', status: 'Active',  records: 6,  initials: 'KP', avatarClass: 'avatar-orange' },
  { name: 'Dr. Priya Singh', email: 'priya@fortis.com',  role: 'doctor',  joined: '20 Jan 2026', status: 'Pending', records: 0,  initials: 'PS', avatarClass: 'avatar-green'  },
  { name: 'Meera Joshi',    email: 'meera@email.com',   role: 'patient', joined: '01 Mar 2026', status: 'Active',  records: 4,  initials: 'MJ', avatarClass: 'avatar-blue'   },
]

export const VERIFY_TABLE = [
  { name: 'Dr. Sneha Rao',    spec: 'Cardiologist',     hospital: 'Apollo Hospitals',        license: 'MCI-2034-A', submitted: '17 Mar 2026' },
  { name: 'Dr. Rajeev Kumar', spec: 'Orthopaedics',     hospital: 'AIIMS Delhi',             license: 'MCI-1876-B', submitted: '15 Mar 2026' },
  { name: 'Dr. Fatima Khan',  spec: 'Gynaecology',      hospital: 'Aga Khan Hospital',       license: 'MCI-2201-C', submitted: '14 Mar 2026' },
  { name: 'Dr. Amit Desai',   spec: 'Dermatology',      hospital: 'Bombay Hospital',         license: 'MCI-1994-D', submitted: '12 Mar 2026' },
  { name: 'Dr. Lalitha Nair', spec: 'Ophthalmology',    hospital: 'Sankara Nethralaya',      license: 'MCI-2089-E', submitted: '10 Mar 2026' },
]

export const NOTIFICATIONS = [
  { id: 1, icon: '🔗', title: 'Dr. Priya Singh requested access to your records',      time: '2 hours ago',  read: false },
  { id: 2, icon: '💊', title: 'New prescription added by Dr. Arjun Mehta',            time: '1 day ago',    read: false },
  { id: 3, icon: '📄', title: 'Your CBC Blood Test report has been uploaded',          time: '2 days ago',   read: true  },
  { id: 4, icon: '✅', title: 'Dr. R. Iyer\'s access to your MRI has been granted',    time: '5 days ago',   read: true  },
  { id: 5, icon: '⏰', title: 'Reminder: Follow-up with Dr. Arjun Mehta on Mar 24',   time: '6 days ago',   read: true  },
]

export const CHAT_RESPONSES = {
  fever: {
    reply: 'Fever is one of the most common symptoms and is usually your body\'s response to an infection.',
    remedies: ['Rest and stay well-hydrated — drink at least 8–10 glasses of water or ORS', 'Apply a cool, damp cloth on your forehead, armpits, and neck', 'Wear lightweight, breathable clothing', 'Lukewarm sponge bath can help lower temperature quickly'],
    otc: ['Paracetamol (Crocin) 500mg every 6 hours for adults', 'Ibuprofen (Brufen) 400mg if paracetamol doesn\'t work — take after food'],
    warning: 'See a doctor if fever is above 103°F (39.4°C), lasts more than 3 days, or is accompanied by severe headache, stiff neck, rash, or difficulty breathing.',
    urgent: false,
  },
  chest: {
    reply: 'Chest pain can have many causes — some are serious and need immediate attention.',
    remedies: ['Sit or lie down immediately and avoid any physical exertion', 'Loosen any tight clothing around your neck or chest', 'If you have a prescribed GTN spray, use it as directed'],
    otc: ['Do NOT self-medicate for chest pain — see a doctor immediately'],
    warning: 'CALL 108 / 112 IMMEDIATELY if chest pain is crushing, spreads to arm or jaw, comes with sweating, shortness of breath, or nausea. This may be a heart attack.',
    urgent: true,
  },
  cough: {
    reply: 'A cough is usually caused by a viral infection, allergies, or irritation of the airways.',
    remedies: ['Honey in warm water or ginger-tulsi tea soothes the throat', 'Steam inhalation with a towel over your head for 10 mins', 'Sleep with your head slightly elevated', 'Avoid cold drinks, dust, and smoky environments'],
    otc: ['Benadryl or Grilinctus syrup for dry/wet cough', 'Strepsils or Cofsils lozenges for throat irritation', 'Levocetrizine if allergy-related'],
    warning: 'See a doctor if cough lasts more than 2 weeks, you cough up blood, have chest pain, or have unexplained weight loss.',
    urgent: false,
  },
  stomach: {
    reply: 'Stomach pain and nausea can stem from indigestion, food poisoning, or gastrointestinal infections.',
    remedies: ['Stay hydrated — sip ORS, coconut water, or plain water frequently', 'Eat a bland BRAT diet: Banana, Rice, Applesauce, Toast', 'Avoid dairy, spicy, and fatty foods until recovered', 'A hot water bag on your abdomen can ease cramping'],
    otc: ['ORS (Electral) sachets to prevent dehydration', 'Domperidone (Domstal) for nausea', 'Omeprazole or Gelusil for acidity/indigestion'],
    warning: 'See a doctor if pain is severe and localised, there is blood in stool or vomit, fever accompanies stomach pain, or symptoms last more than 48 hours.',
    urgent: false,
  },
  fatigue: {
    reply: 'Persistent fatigue and low energy can have many causes including nutritional deficiency, poor sleep, or an underlying medical condition.',
    remedies: ['Ensure 7–9 hours of quality sleep and maintain a consistent sleep schedule', 'Eat iron and vitamin B12-rich foods: spinach, eggs, meat, lentils', 'Stay hydrated throughout the day', '20-minute light exercise daily can actually boost energy', 'Reduce screen time before bed'],
    otc: ['Iron + Folic Acid supplements if anaemia is suspected', 'Vitamin B12 (Methylcobalamin) if deficient', 'Vitamin D3 supplements — especially for desk workers'],
    warning: 'See a doctor if fatigue is severe, persists for more than 2 weeks, comes with unexplained weight loss, shortness of breath, or persistent low mood.',
    urgent: false,
  },
  headache: {
    reply: 'Headaches are most commonly caused by tension, dehydration, screen strain, or sinusitis.',
    remedies: ['Drink a large glass of water immediately', 'Apply a cold or warm pack to your forehead or neck', 'Massage your temples gently in circular motions', 'Step away from screens and rest in a dark, quiet room', 'Stretch your neck and shoulder muscles'],
    otc: ['Paracetamol 500mg for tension headaches', 'Saridon or Combiflam if pain is moderate', 'Sumatriptan for diagnosed migraines (prescription required)'],
    warning: 'Seek immediate care if headache is sudden and extremely severe ("thunderclap"), comes with vision changes, confusion, weakness, stiff neck, or follows a head injury.',
    urgent: false,
  },
  cold: {
    reply: 'Common cold is a viral infection of the upper respiratory tract. It usually resolves in 7–10 days.',
    remedies: ['Drink warm fluids: kadha, ginger-lemon-honey tea, soups', 'Saline nasal drops or spray to relieve congestion', 'Steam inhalation 2–3 times daily', 'Rest as much as possible — your immune system needs energy', 'Gargle with warm salt water for sore throat'],
    otc: ['Cetirizine or Loratadine for runny nose and sneezing', 'Vicks VapoRub on chest and under nostrils', 'Paracetamol for associated fever or body ache'],
    warning: 'See a doctor if cold symptoms worsen after 7 days, you develop high fever, severe facial pain (sinusitis), or breathing difficulty.',
    urgent: false,
  },
  back: {
    reply: 'Back pain is very common and is usually caused by muscle strain, poor posture, or prolonged sitting.',
    remedies: ['Apply a hot water bag or heating pad to the area for 15–20 mins', 'Gentle stretching — cat-cow and child\'s pose yoga', 'Avoid sitting for more than 45 mins without a break', 'Sleep on a firm mattress on your side with a pillow between knees'],
    otc: ['Ibuprofen (Brufen) 400mg after food for pain relief', 'Combiflam tablet if pain is severe', 'Volini or Moov gel applied topically 3x daily'],
    warning: 'See a doctor if pain shoots down your leg, causes numbness or weakness, follows an injury, or does not improve after 3–5 days of rest.',
    urgent: false,
  },
  skin: {
    reply: 'Skin rashes and itching can be caused by allergies, heat rash, eczema, contact dermatitis, or fungal infections.',
    remedies: ['Avoid scratching — it worsens inflammation and risks infection', 'Keep the area clean and dry', 'Wear loose, breathable cotton clothing', 'Cool water compress on the itchy area for relief', 'Avoid perfumed soaps or new detergents'],
    otc: ['Calamine lotion applied gently on rash', 'Cetirizine 10mg at night for allergic itching', 'Clotrimazole cream if fungal infection is suspected'],
    warning: 'See a doctor if the rash is spreading rapidly, has blisters or open sores, is accompanied by fever, or does not improve in 3–4 days.',
    urgent: false,
  },
  anxiety: {
    reply: 'Anxiety, stress, and sleep issues are increasingly common and have both physical and mental health dimensions.',
    remedies: ['Practice 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s', 'Daily 20–30 min walk or light exercise', 'Limit news and social media consumption', 'Journaling before bed to clear the mind', 'Talk to a trusted friend or family member'],
    otc: ['Ashwagandha supplements (KSM-66) for stress support', 'Melatonin 0.5–1mg for sleep onset (short term only)'],
    warning: 'Please speak to a mental health professional or doctor if anxiety is interfering with daily life, causing panic attacks, or accompanied by persistent low mood.',
    urgent: false,
  },
}

export function getSymptomResponse(msg) {
  const m = msg.toLowerCase()
  if (m.includes('chest') || m.includes('heart attack') || m.includes("can't breathe") || m.includes('cannot breathe')) return CHAT_RESPONSES.chest
  if (m.includes('cough') || m.includes('throat') || m.includes('hoarse')) return CHAT_RESPONSES.cough
  if (m.includes('stomach') || m.includes('nausea') || m.includes('vomit') || m.includes('diarrhea') || m.includes('loose motion') || m.includes('abdomen')) return CHAT_RESPONSES.stomach
  if (m.includes('fatigue') || m.includes('tired') || m.includes('energy') || m.includes('exhausted') || m.includes('weak')) return CHAT_RESPONSES.fatigue
  if (m.includes('headache') || m.includes('head pain') || m.includes('migraine')) return CHAT_RESPONSES.headache
  if (m.includes('cold') || m.includes('runny') || m.includes('blocked nose') || m.includes('stuffy') || m.includes('congestion') || m.includes('sneezing')) return CHAT_RESPONSES.cold
  if (m.includes('back') || m.includes('spine') || m.includes('backache')) return CHAT_RESPONSES.back
  if (m.includes('rash') || m.includes('skin') || m.includes('itch') || m.includes('hives') || m.includes('allerg')) return CHAT_RESPONSES.skin
  if (m.includes('stress') || m.includes('anxiety') || m.includes('sleep') || m.includes('insomnia') || m.includes('nervous') || m.includes('worry') || m.includes('panic')) return CHAT_RESPONSES.anxiety
  return CHAT_RESPONSES.fever
}
