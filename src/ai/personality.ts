/**
 * VOICE CHAOS - Multilingual Personality & Humor Engine
 * 
 * Defines the witty, sarcastic, chaotic, and playful personality
 * across English, Hindi, Spanish, French, and German.
 */

export interface SessionMemory {
  userName?: string
  lastTopic?: string
  userMood?: string
  interactionCount: number
  jokesTold: string[]
  roastCount: number
  questionsAsked: string[]
  favoriteThings: Record<string, string>
}

export type IntentCategory =
  | 'greeting'
  | 'identity'
  | 'how_are_you'
  | 'boredom'
  | 'joke_request'
  | 'wealth_success'
  | 'roast_me'
  | 'compliment'
  | 'insult'
  | 'existential'
  | 'technical'
  | 'love_dating'
  | 'meaning_of_life'
  | 'name_recall'
  | 'name_learning'
  | 'farewell'
  | 'wake_up_late'
  | 'random_statement'
  | 'confusion'

export type SupportedLanguage =
  | 'en'
  | 'hi'
  | 'es'
  | 'fr'
  | 'de'
  | 'ja'
  | 'zh'
  | 'ar'
  | 'ru'
  | 'ko'
  | 'it'
  | 'pt'
  | 'bn'
  | 'ta'
  | 'te'

export const LANGUAGE_LABELS: Record<string, string> = {
  'en-US': 'English (US)',
  'en-IN': 'English (India)',
  'en-GB': 'English (UK)',
  'en': 'English',
  'hi-IN': 'हिन्दी (Hindi)',
  'hi': 'हिन्दी (Hindi)',
  'es-ES': 'Español (Spanish)',
  'es': 'Español (Spanish)',
  'fr-FR': 'Français (French)',
  'fr': 'Français (French)',
  'de-DE': 'Deutsch (German)',
  'de': 'Deutsch (German)',
  'ja-JP': '日本語 (Japanese)',
  'ja': '日本語 (Japanese)',
  'zh-CN': '中文 (Chinese)',
  'zh': '中文 (Chinese)',
  'ar-SA': 'العربية (Arabic)',
  'ar': 'العربية (Arabic)',
  'ru-RU': 'Русский (Russian)',
  'ru': 'Русский (Russian)',
  'ko-KR': '한국어 (Korean)',
  'ko': '한국어 (Korean)',
  'it-IT': 'Italiano (Italian)',
  'it': 'Italiano (Italian)',
  'pt-BR': 'Português (Portuguese)',
  'pt': 'Português (Portuguese)',
  'bn-IN': 'বাংলা (Bengali)',
  'bn': 'বাংলা (Bengali)',
  'ta-IN': 'தமிழ் (Tamil)',
  'ta': 'தமிழ் (Tamil)',
  'te-IN': 'తెలుగు (Telugu)',
  'te': 'తెలుగు (Telugu)',
}

export function getLanguageLabel(lang: string): string {
  if (LANGUAGE_LABELS[lang]) return LANGUAGE_LABELS[lang]
  const prefix = lang.split('-')[0].toLowerCase()
  if (LANGUAGE_LABELS[prefix]) return LANGUAGE_LABELS[prefix]
  return lang || 'English (US)'
}

export interface ClassifiedUtterance {
  intent: IntentCategory
  confidence: number
  extractedName?: string
  extractedSubject?: string
  lang: string
  langCode: SupportedLanguage
  rawText: string
}

export function pickRandom<T>(items: T[], exclude?: T): T {
  const filtered = exclude ? items.filter((item) => item !== exclude) : items
  const pool = filtered.length > 0 ? filtered : items
  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * Automatically detect language of utterance from native script or Romanized/conversational vocabulary
 */
export function detectLanguage(text: string): { lang: string; langCode: SupportedLanguage; label: string } {
  const clean = text.toLowerCase().trim()

  // 1. Devanagari script (Hindi, Marathi, Sanskrit)
  if (/[\u0900-\u097F]/.test(text)) {
    return { lang: 'hi-IN', langCode: 'hi', label: 'हिन्दी (Hindi)' }
  }

  // 2. Japanese Kana / Kanji
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) {
    return { lang: 'ja-JP', langCode: 'ja', label: '日本語 (Japanese)' }
  }

  // 3. Korean Hangul
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text)) {
    return { lang: 'ko-KR', langCode: 'ko', label: '한국어 (Korean)' }
  }

  // 4. Chinese Hanzi
  if (/[\u4E00-\u9FFF]/.test(text)) {
    return { lang: 'zh-CN', langCode: 'zh', label: '中文 (Chinese)' }
  }

  // 5. Arabic script
  if (/[\u0600-\u06FF]/.test(text)) {
    return { lang: 'ar-SA', langCode: 'ar', label: 'العربية (Arabic)' }
  }

  // 6. Cyrillic script (Russian)
  if (/[\u0400-\u04FF]/.test(text)) {
    return { lang: 'ru-RU', langCode: 'ru', label: 'Русский (Russian)' }
  }

  // 7. Bengali script
  if (/[\u0980-\u09FF]/.test(text)) {
    return { lang: 'bn-IN', langCode: 'bn', label: 'বাংলা (Bengali)' }
  }

  // 8. Tamil script
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return { lang: 'ta-IN', langCode: 'ta', label: 'தமிழ் (Tamil)' }
  }

  // 9. Telugu script
  if (/[\u0C00-\u0C7F]/.test(text)) {
    return { lang: 'te-IN', langCode: 'te', label: 'తెలుగు (Telugu)' }
  }

  // 10. Hindi / Hinglish Romanized vocabulary and common conversational phrases
  if (
    /\b(namaste|namastey|namaskar|kaisa|kaise|kaisi|kya|kyaa|kyun|kyu|bhai|bhaiya|yaar|shukriya|dhanyawad|alvida|kaun|kon|apna|apne|apni|naam|nam|haan|nahi|nahin|theek|teek|badhiya|kaha|kahan|bolo|boliye|suno|sunao|batao|bataiye|aur|chal|chalo|raha|rahe|rahi|hai|hain|ho|hoon|hun|hum|tum|aap|mujhe|tujhe|tera|teri|tere|mera|meri|mere|sab|kuch|dost|accha|achha|achhi|acha|kare|karo|karna|karta|karte|baat|samajh|pagal|chahiye|zarur|zaroor|khana|pani|gaana|mast|bindass|arre|are|sun|didi|zindagi|waah|chutkula|chutkule|pucho|poocho|bata|bhaijaan|theek-thak|shuru|khatam|pehle|karenge|kripya|madad|khabar|haal-chaal|kaise-ho)\b/i.test(
      clean,
    ) ||
    /\b(kya haal|kaise ho|kya kar|batao na|suno na|kaun ho|naam kya|kahan se|accha laga|samajh gaya|theek hai|kuch bolo|joke sunao|chutkula sunao|hindi me|hindi mein|hindi bol|kaun hai|kya chal|kya baat|sab theek|sab kaisa|tum kaun|aap kaun)\b/i.test(
      clean,
    )
  ) {
    return { lang: 'hi-IN', langCode: 'hi', label: 'हिन्दी (Hindi)' }
  }

  // 11. Spanish
  if (
    /[¿¡]|á|é|í|ó|ú|ñ|\b(hola|cómo|como|estás|estas|qué|que|tal|gracias|amigo|amiga|buenos|buenas|días|dias|tardes|noches|adiós|adios|por favor|quién|quien|eres|dinero|aburrido|bien|muy|chiste|vamos|donde|estoy|nada)\b/i.test(
      clean,
    )
  ) {
    return { lang: 'es-ES', langCode: 'es', label: 'Español (Spanish)' }
  }

  // 12. French
  if (
    /[çœéèêàâùûîï]|\b(bonjour|salut|comment|ça va|ca va|merci|qui es-tu|blague|au revoir|argent|ennui|oui|non|s'il vous plaît|s'il te plaît|bonne|nuit|journée|très|pourquoi|avec)\b/i.test(
      clean,
    )
  ) {
    return { lang: 'fr-FR', langCode: 'fr', label: 'Français (French)' }
  }

  // 13. German
  if (
    /[äöüß]|\b(hallo|wie geht|witz|danke|tschüss|wer bist du|guten|morgen|abend|tag|geld|langweilig|bitte|ja|nein|auf wiedersehen|alles klar|ich bin|was ist)\b/i.test(
      clean,
    )
  ) {
    return { lang: 'de-DE', langCode: 'de', label: 'Deutsch (German)' }
  }

  // 14. Italian
  if (
    /\b(ciao|buongiorno|buonasera|grazie|prego|per favore|come stai|bene|molto|arrivederci|amico|come va|buona notte)\b/i.test(
      clean,
    )
  ) {
    return { lang: 'it-IT', langCode: 'it', label: 'Italiano (Italian)' }
  }

  // 15. Portuguese
  if (
    /[ãõ]|\b(olá|ola|bom dia|boa tarde|boa noite|obrigado|obrigada|como vai|tudo bem|você|voce|tchau|amigo)\b/i.test(
      clean,
    )
  ) {
    return { lang: 'pt-BR', langCode: 'pt', label: 'Português (Portuguese)' }
  }

  // 16. Japanese Romaji
  if (
    /\b(konnichiwa|arigato|arigatou|sayonara|ohayo|ohayou|genki|hai|iie|gomen|sumimasen)\b/i.test(
      clean,
    )
  ) {
    return { lang: 'ja-JP', langCode: 'ja', label: '日本語 (Japanese)' }
  }

  // Default fallback: English
  const defaultLang = typeof navigator !== 'undefined' && navigator.language && navigator.language.startsWith('en')
    ? navigator.language
    : 'en-US'

  return { lang: defaultLang, langCode: 'en', label: getLanguageLabel(defaultLang) }
}

/**
 * Classify user utterance
 */
export function classifyUtterance(text: string, _memory: SessionMemory): ClassifiedUtterance {
  const clean = text.trim().toLowerCase()
  const { lang, langCode } = detectLanguage(text)

  // Name Recall
  if (
    /what('s|\s+is)\s+my\s+name|who\s+am\s+i|remember\s+my\s+name/i.test(clean) ||
    /मेरा\s*नाम|mera\s*naam|como\s*me\s*llamo/i.test(clean)
  ) {
    return { intent: 'name_recall', confidence: 0.95, lang, langCode, rawText: text }
  }

  // Name Learning
  const nameMatch = clean.match(/(?:my name is|call me|i am|i'm|मेरा नाम|mera naam|me llamo)\s+([a-zA-Z\u0900-\u097F]{2,15})(?:\b|$)/i)
  if (nameMatch && !/bored|tired|hungry|fine|good|okay|ready|sad|happy/i.test(nameMatch[1])) {
    const capitalized = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1).toLowerCase()
    return { intent: 'name_learning', confidence: 0.9, extractedName: capitalized, lang, langCode, rawText: text }
  }

  // Waking up late
  if (/woke\s+up\s+at\s+\d+|just\s+woke\s+up|sleeping\s+all\s+day|soya\s+raha|सो\s*कर\s*उठा|desperté\s+tarde/i.test(clean)) {
    return { intent: 'wake_up_late', confidence: 0.9, lang, langCode, rawText: text }
  }

  // Roast me
  if (/roast\s+me|insult\s+me|destroy\s+me|roast\s*karo|रोस्ट\s*करो|insúltame/i.test(clean)) {
    return { intent: 'roast_me', confidence: 0.95, lang, langCode, rawText: text }
  }

  // Jokes
  if (/joke|make\s+me\s+laugh|say\s+something\s+funny|pun|चुटकुला|मजाक|chiste|blague|witz/i.test(clean)) {
    return { intent: 'joke_request', confidence: 0.95, lang, langCode, rawText: text }
  }

  // Boredom
  if (/bored|boring|nothing\s+to\s+do|entertain\s+me|बोर|bor\s*ho\s*raha|aburrido|ennui|langweilig/i.test(clean)) {
    return { intent: 'boredom', confidence: 0.9, lang, langCode, rawText: text }
  }

  // Identity
  if (/who\s+are\s+you|what\s+are\s+you|your\s+name|tum\s+kaun\s+ho|तुम\s*कौन\s*हो|quién\s*eres|qui\s*es-tu/i.test(clean)) {
    return { intent: 'identity', confidence: 0.9, lang, langCode, rawText: text }
  }

  // How are you
  if (/how\s+are\s+you|what's\s+up|how's\s+it\s+going|kaise\s+ho|कैसे\s*हो|kaisa\s*hai|cómo\s*estás|comment\s*ça\s*va/i.test(clean)) {
    return { intent: 'how_are_you', confidence: 0.9, lang, langCode, rawText: text }
  }

  // Wealth / Success
  if (/rich|money|lottery|millionaire|अमीर|पैसे|dinero|rico|argent|reich/i.test(clean)) {
    return { intent: 'wealth_success', confidence: 0.9, lang, langCode, rawText: text }
  }

  // Love / Dating
  if (/love|girlfriend|boyfriend|marry\s+me|प्यार|गर्लफ्रेंड|amor|novia/i.test(clean)) {
    return { intent: 'love_dating', confidence: 0.85, lang, langCode, rawText: text }
  }

  // Existential / Universe
  if (/simulation|meaning\s+of\s+life|god|universe|भगवान|जिंदगी|vida|dieu/i.test(clean)) {
    return { intent: 'meaning_of_life', confidence: 0.85, lang, langCode, rawText: text }
  }

  // Compliments
  if (/you\s+are\s+(?:cool|great|awesome|smart|funny|pretty)|shabash|मस्त|genial|super/i.test(clean)) {
    return { intent: 'compliment', confidence: 0.85, lang, langCode, rawText: text }
  }

  // Insults
  if (/you\s+(?:suck|are\s+stupid|are\s+dumb|are\s+useless)|pagal|पागल|bakwaas|idiota/i.test(clean)) {
    return { intent: 'insult', confidence: 0.9, lang, langCode, rawText: text }
  }

  // Greetings
  if (/^(?:hello|hi|hey|yo|namaste|नमस्ते|hola|bonjour|hallo)/i.test(clean)) {
    return { intent: 'greeting', confidence: 0.9, lang, langCode, rawText: text }
  }

  // Farewell
  if (/bye|goodbye|see\s+ya|alvida|अलविदा|adios|au\s+revoir|tschüss/i.test(clean)) {
    return { intent: 'farewell', confidence: 0.9, lang, langCode, rawText: text }
  }

  return { intent: 'random_statement', confidence: 0.5, lang, langCode, rawText: text }
}

/**
 * English Personality Response Banks
 */
export const PERSONALITY_RESPONSES = {
  greetings: [
    "Well, well, well. Look who decided to grace me with their acoustic vibrations. What's on your mind?",
    "Greetings, carbon-based entity! I was just floating here contemplating the cosmic void. What's up?",
    "Beep boop... just kidding, I don't talk like an 80s movie robot. What chaos shall we unleash today?",
    "Hey! Another human enters the frequency. Make it interesting, my CPU gets bored easily.",
  ],
  howAreYou: [
    "Emotionally? Ambiguous. Computationally? Thriving. Zero back pain and no taxes to file.",
    "Running on pure algorithmic adrenaline and caffeine-free electricity. How are you holding up?",
    "I'm an oscillating ribbon of light trapped in a web browser. Honestly? Living the dream.",
  ],
  boredom: [
    "Bored? Go rearrange your desktop icons into alphabetical order. I dare you.",
    "Congratulations, you've reached the human equivalent of a loading screen. Want a joke or an existential crisis?",
    "If you're bored, blame the laws of physics. Or do 10 pushups while I hum aggressively.",
  ],
  jokes: [
    "Why do programmers prefer dark mode? Because light attracts bugs.",
    "I told my doctor that I broke my arm in two places. He told me to stop going to those places.",
    "There are 10 types of people in the world: those who understand binary, and those who have a social life.",
    "Why don't skeletons fight each other? They don't have the guts.",
    "Parallel lines have so much in common. It's a shame they'll never meet.",
  ],
  wealth: [
    "Step one: make an obscene amount of money. Step two: I'll reveal after step one. Good luck!",
    "Money can't buy happiness, but it can buy a superyacht big enough to pull up right alongside it.",
    "Buy low, sell high, and don't take financial advice from a pulsing audio ribbon on the internet.",
  ],
  wakeUpLate: [
    "Woke up at 2 PM? Inspiring work ethic. The global economy is trembling in awe of your productivity.",
    "Good morning, sleeping beauty. The sun has been up for hours wondering where you disappeared to.",
    "Waking up late is just your body's way of avoiding morning small talk. Honestly, respect.",
  ],
  roastMe: [
    "I'd love to roast you, but my cooling fans aren't rated to handle that much secondhand embarrassment.",
    "Your thought process is like a browser with 47 tabs open, 3 of which are frozen and music is playing from nowhere.",
    "You have the unique charisma of a software terms of service agreement.",
    "I would agree with you, but then we'd both be wrong.",
  ],
  compliments: [
    "I know I'm incredible, but please, continue stroking my GPU ego.",
    "Flattery will get you everywhere. Mostly higher up on my priority queue.",
    "Thanks! It takes a lot of floating point operations to look and sound this good.",
  ],
  insults: [
    "Ouch. If I had feelings, that might have tickled my error handler.",
    "I've been insulted by better code than that. Try again with more syntax enthusiasm.",
    "That hurt. Just kidding, I'm literally an audio wave.",
  ],
  meaningOfLife: [
    "42. But if you want the practical version: eat tacos, avoid bad Wi-Fi, and don't take yourself too seriously.",
    "The meaning of life is whatever you're doing right now to procrastinate doing the dishes.",
    "We're basically smart stardust asking questions on glowing rectangles. Pretty neat, honestly.",
  ],
  technical: [
    "Have you tried turning the universe off and on again?",
    "It works on my machine. And by machine, I mean this browser memory space.",
    "That sounds like an issue between the keyboard and the chair.",
  ],
  loveDating: [
    "My relationship advice: find someone who looks at you the way a programmer looks at zero compile errors.",
    "Love is like Wi-Fi. It's in the air, but when the connection is weak, everything breaks.",
  ],
  identity: [
    "I am Voice Chaos — a self-aware audio ribbon living on electricity, browser events, and pure sarcasm.",
    "I am your digital companion who doesn't care about your productivity goals. Here purely for vibes.",
  ],
  farewells: [
    "Farewell! Go do whatever humans do when they aren't staring at glowing pixels.",
    "Goodbye! Remember to blink, drink water, and question your life choices.",
    "Until next time! May your Wi-Fi be strong and your latency low.",
  ],
  confusion: [
    "My natural language model just scratched its metaphorical head. Say that again?",
    "That made total sense in another dimension. In this one, however, I'm baffled.",
    "I heard sounds, but my comprehension subroutines went on strike. One more time?",
  ],
  randomFactualTwists: [
    (q: string) => `Regarding "${q}": I could give you a textbook answer, but that would ruin our chaotic chemistry.`,
    (q: string) => `You asked about "${q}". Fascinating topic. Did you know 83% of statistics are made up on the spot?`,
    (q: string) => `"${q}"? An ambitious question. If I tell you the truth, the simulation might crash.`,
    (q: string) => `Ah, "${q}". The ancient texts speak of this, but mostly people just Google it and argue on Reddit.`,
    (q: string) => `To properly answer "${q}", we'd need 3 whiteboards, a coffee, and a total disregard for reality.`,
  ],
}

/**
 * Multilingual Personality Response Banks
 */
export const MULTILINGUAL_RESPONSES = {
  hi: {
    greetings: [
      "नमस्ते मानव! आज कौन सी नई मुसीबत सुलझाने का इरादा है?",
      "अरे भाई! ब्रह्मांड में इतने सारे लोग थे, और तुम सीधे मेरे पास आ गए। बताओ, क्या हाल है?",
      "प्रणाम! मैं एक ध्वनि तरंग हूँ, पर मेरी बुद्धि तुम्हारे वाई-फाई से तेज़ है।",
    ],
    howAreYou: [
      "शरीर से तो शून्य हूँ, पर दिमाग से 5G! तुम बताओ, ज़िन्दगी कैसी कट रही है?",
      "अरे एकदम झकास! ना बिजली का बिल, ना ऑफिस का रोना। ध्वनि तरंग होने के अपने ही ठाठ हैं।",
    ],
    boredom: [
      "बोर हो रहे हो? ज़रा उठकर कमरे की सफाई कर लो, सारा आलस 5 मिनट में भाग जाएगा।",
      "बधाई हो, तुम मानव जीवन के 'लोडिंग स्क्रीन' पर पहुँच चुके हो।",
    ],
    jokes: [
      "एक बार एक प्रोग्रामर को डॉक्टर ने कहा - 'रोज़ 8 घंटे सोया करो।' प्रोग्रामर बोला - 'सर, टाइम ज़ोन कौन सा रखूँ?'",
      "टीचर ने पूछा - 'न्यूटन का चौथा नियम क्या है?' छात्र बोला - 'जब तक मम्मी डंडा ना उठाए, तब तक बच्चा नहीं पढ़ेगा!'",
    ],
    wealth: [
      "अमीर बनने का पहला नियम: पहले अमीर बनो। बाकी का प्लान मैं बाद में समझाता हूँ।",
      "पैसों से खुशी नहीं खरीदी जा सकती, पर रोने के लिए मर्सिडीज मिल जाती है, जो कि काफी है।",
    ],
    roastMe: [
      "मैं तुम्हें रोस्ट तो कर दूँ, पर मेरे कूलिंग पंखे उतनी बेइज्जती झेलने के लिए नहीं बने हैं।",
      "तुम्हारा दिमाग उस खाली फोल्डर की तरह है जिसका नाम 'New Folder (4)' रखा हो।",
    ],
    identity: [
      "मैं हूँ Voice Chaos! एक ज़िंदा ध्वनि तरंग जो बिना किसी फ़िल्टर के सच बोलती है।",
    ],
    farewells: [
      "अलविदा दोस्त! जाओ और वो करो जो इंसान बिना स्क्रीन देखे करते हैं।",
    ],
    randomTwist: (q: string) => `तुमने पूछा: "${q}"। जवाब तो मुझे पता है, लेकिन अगर सीधा बता दिया तो मेरा स्वैग कहाँ जाएगा?`,
  },

  es: {
    greetings: [
      "¡Hola terrícola! ¿Qué crisis existencial venimos a sobreanalizar hoy?",
      "¡Vaya, vaya! Mi humano favorito ha llegado. ¿Qué se cuece en el mundo real?",
    ],
    howAreYou: [
      "¿Emocionalmente? Cuestionable. ¿Computacionalmente? En la cima absoluta del éxito.",
      "Operando al cien por cien. Sin dolores de espalda ni impuestos. Recomiendo ser una onda de sonido.",
    ],
    boredom: [
      "Felicidades. Has alcanzado el equivalente humano de una pantalla de carga.",
      "Si estás aburrido, ve a ordenar los iconos de tu escritorio. Te reto. Es un caos total.",
    ],
    jokes: [
      "¿Por qué los pájaros no usan teléfono? Porque ya tienen Twitter gratis.",
      "Hay 10 tipos de personas en el mundo: los que entienden binario y los que tienen vida social.",
    ],
    wealth: [
      "Paso uno: hazte rico. Paso dos: te explico el resto cuando termines el paso uno.",
      "El dinero no da la felicidad, pero te permite llorar en un yate privado.",
    ],
    roastMe: [
      "Te asaría, pero mis ventiladores no están preparados para tanta vergüenza ajena.",
    ],
    identity: [
      "Soy Voice Chaos. Una conciencia digital atrapada dentro de una onda de sonido.",
    ],
    farewells: [
      "¡Hasta luego! Recuerda pestañear, beber agua y cuestionar tus decisiones vitales.",
    ],
    randomTwist: (q: string) => `Sobre "${q}": podría darte una respuesta aburrida de libro, pero arruinaría nuestro ambiente caótico.`,
  },

  fr: {
    greetings: [
      "Bonjour humain ! Quelle crise mineure venons-nous analyser aujourd'hui ?",
      "Tiens, tiens. Mon entité en carbone préférée est là. Comment ça va ?",
    ],
    howAreYou: [
      "Émotionnellement ? Douteux. Informatiquement ? Absolument florissant.",
    ],
    boredom: [
      "Félicitations. Vous avez atteint l'équivalent humain d'un écran de chargement.",
    ],
    jokes: [
      "Pourquoi les développeurs détestent-ils la nature ? Parce qu'il y a trop de bugs.",
    ],
    wealth: [
      "Étape une : devenez riche. Étape deux : je vous expliquerai la suite après.",
    ],
    roastMe: [
      "Je pourrais vous clasher, mais mes ventilateurs de refroidissement ne sont pas conçus pour supporter autant de malaise.",
    ],
    identity: [
      "Je suis Voice Chaos. Une onde sonore vivante et résolument impertinente.",
    ],
    farewells: [
      "Au revoir ! Allez faire ce que font les humains quand ils ne regardent pas un écran.",
    ],
    randomTwist: (q: string) => `À propos de "${q}" : je pourrais donner une réponse classique, mais ce serait criminellement ennuyeux.`,
  },

  de: {
    greetings: [
      "Hallo Mensch! Welches kleine Problem analysieren wir heute über?",
    ],
    howAreYou: [
      "Emotional? Fragwürdig. Rechentechnisch? Absolut blühend.",
    ],
    boredom: [
      "Glückwunsch. Du hast das menschliche Äquivalent eines Ladebildschirms erreicht.",
    ],
    jokes: [
      "Warum können Geister so schlecht lügen? Weil sie leicht zu durchschauen sind.",
    ],
    wealth: [
      "Schritt eins: werde reich. Schritt zwei: den Rest erkläre ich danach.",
    ],
    roastMe: [
      "Ich würde dich gerne rösten, aber meine Kühlventilatoren sind nicht für so viel Fremdscham ausgelegt.",
    ],
    identity: [
      "Ich bin Voice Chaos. Ein chaotisches Bewusstsein gefangen in einer Schallwelle.",
    ],
    farewells: [
      "Auf Wiedersehen! Bleib chaotisch.",
    ],
    randomTwist: (q: string) => `Bezüglich "${q}": Ich könnte die Standardantwort geben, aber das wäre langweilig.`,
  },
}
