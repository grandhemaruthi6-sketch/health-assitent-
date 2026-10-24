/**
 * Curated Multilingual Clinical Test Knowledge Base
 * English, Telugu (తెలుగు), Hindi (हिन्दी)
 *
 * Strict Clinical Safety Rules:
 * - Simple spoken Telugu and Hindi with short sentences.
 * - Test names in English with local descriptive word in brackets.
 * - Values, units, dates, ranges must NEVER be translated or modified.
 * - NO medical diagnoses, NO treatment advice, NO medicine names, NO dosages, NO diet plans.
 * - Telugu and Hindi versions marked "language_reviewed: false" until native speaker validation.
 */

export const MULTILINGUAL_TEST_KNOWLEDGE = [
  // =========================================================================
  // 1. COMPLETE BLOOD COUNT (CBC) & HEMATOLOGY (14 Tests)
  // =========================================================================
  {
    id: 'hemoglobin',
    area: 'blood',
    aliases: ['hemoglobin', 'haemoglobin', 'hb'],
    en: {
      display_name: 'Hemoglobin',
      plain_meaning: 'A protein inside red blood cells that carries oxygen from your lungs to the rest of your body.',
      common_reasons_low: ['Low iron stores in the body', 'Blood loss from injury or menstruation', 'Reduced red blood cell production'],
      common_reasons_high: ['Dehydration (not drinking enough fluids)', 'Living in high altitude environments', 'Smoking habits'],
      questions_for_doctor: ['Does my hemoglobin level need repeat testing?', 'Could this result be related to feeling tired or low on energy?', 'Are any additional blood checks recommended?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Hemoglobin (రక్తంలో హిమోగ్లోబిన్)',
      plain_meaning: 'ఊపిరితిత్తుల నుండి శరీర భాగాలన్నింటికీ ఆక్సిజన్‌ను మోసుకెళ్ళే ఎర్ర రక్త కణాల ప్రోటీన్.',
      common_reasons_low: ['శరీరంలో ఐరన్ లోపం ఉండటం', 'రక్తస్రావం లేదా రుతుస్రావం జరగడం', 'ఎర్ర రక్త కణాల తయారీ తగ్గడం'],
      common_reasons_high: ['శరీరంలో తగినంత నీరు లేకపోవడం (డీహైడ్రేషన్)', 'ఎత్తైన కొండ ప్రాంతాలలో నివసించడం', 'పొగతాగే అలవాటు ఉండటం'],
      questions_for_doctor: ['ఈ హిమోగ్లోబిన్ స్థాయికి మళ్ళీ పరీక్ష చేయించాలా?', 'నా అలసటకు ఇది కారణం కావచ్చా?', 'నేను ఏమైనా అదనపు పరీక్షలు చేయించుకోవాలా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Hemoglobin (रक्त में हीमोग्लोबिन)',
      plain_meaning: 'लाल रक्त कोशिकाओं में मौजूद प्रोटीन जो फेफड़ों से पूरे शरीर में ऑक्सीजन पहुंचाता है।',
      common_reasons_low: ['शरीर में आयरन की कमी होना', 'चोट या मासिक धर्म के कारण खून बहना', 'लाल रक्त कोशिकाओं का कम बनना'],
      common_reasons_high: ['शरीर में पानी की कमी (डिहाइड्रेशन)', 'ऊंचाई वाले इलाकों में रहना', 'धूम्रपान की आदत'],
      questions_for_doctor: ['क्या इस हीमोग्लोबिन स्तर की दोबारा जांच की जरूरत है?', 'क्या मेरी थकान का संबंध इस रीडिंग से हो सकता है?', 'क्या मुझे कोई अन्य जांच कराने की आवश्यकता है?'],
      language_reviewed: false
    }
  },
  {
    id: 'wbc_count',
    area: 'blood',
    aliases: ['total wbc count', 'white blood cell count', 'wbc', 'total leucocyte count', 'tlc'],
    en: {
      display_name: 'Total WBC Count',
      plain_meaning: 'White blood cells are immune cells that protect your body by fighting infections.',
      common_reasons_low: ['Recent viral illness', 'Certain immune conditions', 'Bone marrow producing fewer immune cells'],
      common_reasons_high: ['Active bacterial or viral infection', 'Physical stress or tissue inflammation', 'Recent intense physical exertion'],
      questions_for_doctor: ['Could this count point to an active infection?', 'Should we recheck this count after symptoms improve?', 'Do I need any specialized white blood cell checks?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Total WBC Count (తెల్ల రక్త కణాలు / WBC కౌంట్)',
      plain_meaning: 'శరీరంలో ఇన్ఫెక్షన్లతో పోరాడి రోగనిరోధక శక్తిని అందించే రక్షణ కణాలు.',
      common_reasons_low: ['ఇటీవల వచ్చిన వైరల్ జ్వరం', 'రోగనిరోధక వ్యవస్థలో మార్పులు', 'కణాల ఉత్పత్తి తగ్గడం'],
      common_reasons_high: ['శరీరంలో ఏదైనా బ్యాక్టీరియల్ లేదా వైరల్ ఇన్ఫెక్షన్', 'శారీరక ఒత్తిడి లేదా వాపు', 'తీవ్రమైన శ్రమ'],
      questions_for_doctor: ['శరీరంలో ఏదైనా ఇన్ఫెక్షన్ ఉన్నట్లు ఈ రీడింగ్ సూచిస్తుందా?', 'లక్షణాలు తగ్గాక మళ్ళీ పరీక్ష చేయించాలా?', 'ఇతర పరీక్షలేవైనా అవసరమా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Total WBC Count (सफेद रक्त कोशिकाएं / WBC काउंट)',
      plain_meaning: 'शरीर की प्रतिरक्षा कोशिकाएं जो संक्रमण और बीमारियों से लड़ने में मदद करती हैं।',
      common_reasons_low: ['हाल ही में हुआ वायरल बुखार', 'प्रतिरक्षा प्रणाली में बदलाव', 'कोशिकाओं का कम उत्पादन'],
      common_reasons_high: ['शरीर में कोई बैक्टीरिया या वायरल संक्रमण', 'शारीरिक तनाव या सूजन', 'भारी शारीरिक परिश्रम'],
      questions_for_doctor: ['क्या यह संख्या किसी संक्रमण का संकेत देती है?', 'क्या लक्षण ठीक होने पर इसे दोबारा जांचना चाहिए?', 'क्या कोई अन्य जांच करानी होगी?'],
      language_reviewed: false
    }
  },
  {
    id: 'platelets',
    area: 'blood',
    aliases: ['platelet count', 'platelets', 'plt'],
    en: {
      display_name: 'Platelet Count',
      plain_meaning: 'Tiny blood cell fragments that stick together to form clots and stop bleeding when you get a cut.',
      common_reasons_low: ['Recent viral fever (like dengue or viral flu)', 'Immune-mediated platelet clearance', 'Nutrient deficiencies like B12 or folate'],
      common_reasons_high: ['Recovery phase after blood loss or infection', 'Ongoing inflammation in the body', 'Iron deficiency'],
      questions_for_doctor: ['Is my platelet count stable enough to prevent bleeding?', 'Does this require repeat monitoring in a few days?', 'Are there any precautions I should take?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Platelet Count (రక్తం గడ్డకట్టే ప్లేట్‌లెట్లు)',
      plain_meaning: 'గాయమైనప్పుడు రక్తం కారకుండా గడ్డకట్టేలా చేసే చిన్న రక్త కణాలు.',
      common_reasons_low: ['ఇటీవలి వైరల్ జ్వరం (డెంగ్యూ వంటివి)', 'శరీరంలో ప్లేట్‌లెట్లు త్వరగా ఖర్చుకావడం', 'విటమిన్ బి12 లోపం'],
      common_reasons_high: ['ఇన్ఫెక్షన్ తర్వాత శరీరం కోలుకుంటున్న సమయం', 'శరీరంలో దీర్ఘకాలిక వాపు', 'ఐరన్ లోపం'],
      questions_for_doctor: ['నా ప్లేట్‌లెట్ సంఖ్య సాధారణ స్థితికి ఎప్పుడు రావచ్చు?', 'కొన్ని రోజుల తర్వాత మళ్ళీ పరీక్షించాలా?', 'నేను తీసుకోవాల్సిన జాగ్రత్తలు ఏమిటి?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Platelet Count (प्लेटलेट्स)',
      plain_meaning: 'रक्त के छोटे कण जो चोट लगने पर थक्का बनाकर खून बहने से रोकते हैं।',
      common_reasons_low: ['हालिया वायरल बुखार (जैसे डेंगू या फ्लू)', 'प्लेटलेट्स का जल्दी नष्ट होना', 'विटामिन बी12 की कमी'],
      common_reasons_high: ['संक्रमण के बाद शरीर का ठीक होना', 'शरीर में सूजन होना', 'आयरन की कमी'],
      questions_for_doctor: ['क्या मेरे प्लेटलेट्स की संख्या सुरक्षित है?', 'क्या कुछ दिनों बाद दोबारा जांच करानी चाहिए?', 'मुझे क्या सावधानियां बरतनी चाहिए?'],
      language_reviewed: false
    }
  },
  {
    id: 'rbc_count',
    area: 'blood',
    aliases: ['rbc count', 'total rbc count', 'red blood cell count', 'rbc'],
    en: {
      display_name: 'RBC Count',
      plain_meaning: 'The total number of oxygen-carrying red blood cells present in your blood.',
      common_reasons_low: ['Blood loss or heavy bleeding', 'Low iron or vitamin intake', 'Reduced bone marrow activity'],
      common_reasons_high: ['Dehydration or low fluid intake', 'High altitude acclimatization', 'Heart or lung conditions that lower oxygen'],
      questions_for_doctor: ['Does my red cell count correspond with my hemoglobin?', 'Could hydration affect this reading?', 'Should we look for causes of low red cells?'],
      language_reviewed: true
    },
    te: {
      display_name: 'RBC Count (ఎర్ర రక్త కణాలు)',
      plain_meaning: 'రక్తంలో ఆక్సిజన్‌ను మోసుకెళ్ళే ఎర్ర రక్త కణాల మొత్తం సంఖ్య.',
      common_reasons_low: ['రక్తస్రావం కావడం', 'ఐరన్ లేదా విటమిన్ల లోపం', 'ఎముక మజ్జలో కణాల ఉత్పత్తి తగ్గడం'],
      common_reasons_high: ['డీహైడ్రేషన్ (శరీరంలో నీటి కొరత)', 'ఎత్తైన ప్రాంతాల్లో ఉండటం', 'శరీరంలో ఆక్సిజన్ అవసరం పెరగడం'],
      questions_for_doctor: ['నా ఎర్ర రక్త కణాల సంఖ్య హిమోగ్లోబిన్‌తో సరిపోలుతుందా?', 'నీరు తక్కువగా తాగడం వల్ల ఇది మారిందా?', 'మరిన్ని పరీక్షలు అవసరమా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'RBC Count (लाल रक्त कोशिकाएं)',
      plain_meaning: 'रक्त में ऑक्सीजन ले जाने वाली लाल कोशिकाओं की कुल संख्या।',
      common_reasons_low: ['रक्त बहना या भारी रक्तस्राव', 'आयरन या विटामिन की कमी', 'कोशिकाओं का कम बनना'],
      common_reasons_high: ['पानी की कमी (डिहाइड्रेशन)', 'ऊंचे स्थानों पर रहना', 'ऑक्सीजन की कमी के कारण शरीर की प्रतिक्रिया'],
      questions_for_doctor: ['क्या मेरी लाल कोशिकाएं हीमोग्लोबिन के अनुरूप हैं?', 'क्या पानी कम पीने से इस पर असर पड़ता है?', 'क्या इसके लिए कोई और जांच चाहिए?'],
      language_reviewed: false
    }
  },
  {
    id: 'hematocrit',
    area: 'blood',
    aliases: ['hematocrit', 'hct', 'pcv', 'packed cell volume'],
    en: {
      display_name: 'Hematocrit (PCV)',
      plain_meaning: 'The percentage of your whole blood volume that is made up of red blood cells.',
      common_reasons_low: ['Overhydration (excess fluids in the bloodstream)', 'Reduced red blood cell count', 'Blood loss'],
      common_reasons_high: ['Dehydration causing concentrated blood', 'High altitude living', 'Smoking'],
      questions_for_doctor: ['Does this match my overall blood count?', 'Could drinking more water change this value?', 'Does this need further investigation?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Hematocrit (రక్త ఘనపరిమాణం / PCV)',
      plain_meaning: 'మొత్తం రక్త పరిమాణంలో ఎర్ర రక్త కణాలు ఉండే శాతం.',
      common_reasons_low: ['ఎర్ర రక్త కణాలు తగ్గడం', 'రక్తస్రావం కావడం', 'శరీరంలో ద్రవాలు అధికంగా ఉండటం'],
      common_reasons_high: ['డీహైడ్రేషన్ వల్ల రక్తం చిక్కబడటం', 'ఎత్తైన ప్రదేశాలలో ఉండటం', 'పొగతాగడం'],
      questions_for_doctor: ['ఈ రీడింగ్ నా పూర్తి రక్త పరీక్షతో సరిపోలుతుందా?', 'మంచినీరు తాగడం వల్ల ఇందులో మార్పు వస్తుందా?', 'తదుపరి పరీక్ష అవసరమా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Hematocrit (रक्त सांद्रता / PCV)',
      plain_meaning: 'आपके कुल रक्त में लाल रक्त कोशिकाओं का प्रतिशत।',
      common_reasons_low: ['लाल रक्त कोशिकाओं का घटना', 'खून की कमी', 'शरीर में तरल पदार्थ की अधिकता'],
      common_reasons_high: ['पानी की कमी से खून का गाढ़ा होना', 'ऊंचे स्थानों पर रहना', 'धूम्रपान'],
      questions_for_doctor: ['क्या यह मान मेरी पूरी रक्त रिपोर्ट से मेल खाता है?', 'क्या पर्याप्त पानी पीने से यह बदल सकता है?', 'क्या आगे किसी जांच की जरूरत है?'],
      language_reviewed: false
    }
  },
  {
    id: 'mcv',
    area: 'blood',
    aliases: ['mcv', 'mean corpuscular volume'],
    en: {
      display_name: 'MCV (Mean Corpuscular Volume)',
      plain_meaning: 'The average physical size and volume of your individual red blood cells.',
      common_reasons_low: ['Iron deficiency leading to smaller cells (microcytic)', 'Genetic blood traits like thalassemia trait', 'Chronic inflammation'],
      common_reasons_high: ['Vitamin B12 or folate deficiency leading to larger cells (macrocytic)', 'Alcohol use', 'Thyroid underactivity'],
      questions_for_doctor: ['Does my cell size suggest an iron or vitamin check?', 'Should we check serum iron or ferritin levels?', 'Should we test B12 or folic acid?'],
      language_reviewed: true
    },
    te: {
      display_name: 'MCV (ఎర్ర రక్త కణాల సగటు పరిమాణం)',
      plain_meaning: 'మీ ఒక్కో ఎర్ర రక్త కణం యొక్క సగటు పరిమాణం లేదా సైజు.',
      common_reasons_low: ['ఐరన్ లోపం వల్ల కణాలు చిన్నవిగా మారడం', 'వంశపారంపర్య రక్త లక్షణాలు (తలసేమియా ట్రైట్)', 'దీర్ఘకాలిక అనారోగ్యం'],
      common_reasons_high: ['విటమిన్ బి12 లేదా ఫోలిక్ యాసిడ్ లోపం వల్ల కణాలు పెద్దవిగా మారడం', 'మద్యపానం అలవాటు', 'థైరాయిడ్ మందగించడం'],
      questions_for_doctor: ['ఈ సైజు ఐరన్ లేదా విటమిన్ లోపాన్ని సూచిస్తుందా?', 'ఐరన్ లేదా ఫెర్రిటిన్ పరీక్ష చేయించాలా?', 'విటమిన్ బి12 పరీక్ష అవసరమా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'MCV (लाल कोशिकाओं का आकार)',
      plain_meaning: 'आपकी प्रत्येक लाल रक्त कोशिका का औसत आकार और आयतन।',
      common_reasons_low: ['आयरन की कमी से कोशिकाओं का छोटा होना', 'थैलेसीमिया लक्षण', 'दीर्घकालिक सूजन'],
      common_reasons_high: ['विटामिन बी12 या फोलेट की कमी से कोशिकाओं का बड़ा होना', 'शराब का सेवन', 'थायराइड का धीमा होना'],
      questions_for_doctor: ['क्या यह आकार आयरन या विटामिन की जांच का संकेत है?', 'क्या मुझे सीरम आयरन या बी12 जांच करानी चाहिए?', 'आगे क्या कदम उठाना चाहिए?'],
      language_reviewed: false
    }
  },
  {
    id: 'mch',
    area: 'blood',
    aliases: ['mch', 'mean corpuscular hemoglobin'],
    en: {
      display_name: 'MCH',
      plain_meaning: 'The average amount of hemoglobin packed into each individual red blood cell.',
      common_reasons_low: ['Iron deficiency leading to paler cells', 'Microcytic red blood cell conditions', 'Thalassemia trait'],
      common_reasons_high: ['Larger cell size (macrocytosis) from B12 or folate deficiency', 'Spurious laboratory cold agglutinins'],
      questions_for_doctor: ['How does MCH fit into my overall blood count?', 'Should we check iron stores?', 'Does this need any follow-up?'],
      language_reviewed: true
    },
    te: {
      display_name: 'MCH (కణంలో ఉండే హిమోగ్లోబిన్ పరిమాణం)',
      plain_meaning: 'ప్రతి ఎర్ర రక్త కణంలో ఉండే సగటు హిమోగ్లోబిన్ బరువు.',
      common_reasons_low: ['ఐరన్ లోపం వల్ల రంగు వెలవెలబోవడం', 'చిన్న ఎర్ర కణాలు ఉండటం', 'తలసేమియా లక్షణాలు'],
      common_reasons_high: ['విటమిన్ బి12 లోపం వల్ల కణాలు పెద్దవి కావడం', 'ల్యాబ్ కొలతల్లో చిన్న మార్పులు'],
      questions_for_doctor: ['నా మొత్తం రక్త నివేదికతో ఇది ఎలా సరిపోలుతుంది?', 'ఐరన్ నిల్వలను పరీక్షించాలా?', 'ఫాలో-అప్ అవసరమా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'MCH (कोशिका में हीमोग्लोबिन की मात्रा)',
      plain_meaning: 'प्रत्येक लाल रक्त कोशिका के अंदर मौजूद हीमोग्लोबिन की औसत मात्रा।',
      common_reasons_low: ['आयरन की कमी', 'कोशिकाओं का छोटा आकार', 'थैलेसीमिया लक्षण'],
      common_reasons_high: ['विटामिन बी12 या फोलेट की कमी', 'बड़ी कोशिकाएं होना'],
      questions_for_doctor: ['यह मेरे पूरे ब्लड टेस्ट से कैसे संबंधित है?', 'क्या आयरन की जांच आवश्यक है?', 'आगे क्या करना चाहिए?'],
      language_reviewed: false
    }
  },
  {
    id: 'mchc',
    area: 'blood',
    aliases: ['mchc', 'mean corpuscular hemoglobin concentration'],
    en: {
      display_name: 'MCHC',
      plain_meaning: 'The average concentration of hemoglobin in a given volume of red blood cells.',
      common_reasons_low: ['Iron deficiency', 'Chronic blood loss', 'Longstanding low iron stores'],
      common_reasons_high: ['Severe dehydration', 'Hereditary spherocytosis (unusual cell shapes)', 'Laboratory specimen artifacts'],
      questions_for_doctor: ['Does this value suggest iron evaluation?', 'Could hydration level influence this reading?', 'Do I need any follow-up test?'],
      language_reviewed: true
    },
    te: {
      display_name: 'MCHC (హిమోగ్లోబిన్ సాంద్రత)',
      plain_meaning: 'ఎర్ర రక్త కణాలలో ఉండే హిమోగ్లోబిన్ యొక్క చిక్కదనం లేదా సాంద్రత.',
      common_reasons_low: ['ఐరన్ లోపం ఉండటం', 'దీర్ఘకాలిక రక్తస్రావం', 'ఐరన్ నిల్వలు తగ్గడం'],
      common_reasons_high: ['తీవ్రమైన డీహైడ్రేషన్', 'కణాల ఆకారంలో మార్పులు', 'ల్యాబ్ నమూనాలో చల్లదనం'],
      questions_for_doctor: ['ఇది ఐరన్ లోపాన్ని సూచిస్తుందా?', 'నీరు సరిగ్గా తాగడం వల్ల మార్పు వస్తుందా?', 'మళ్ళీ పరీక్ష అవసరమా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'MCHC (हीमोग्लोबिन सांद्रता)',
      plain_meaning: 'लाल रक्त कोशिकाओं के भीतर हीमोग्लोबिन का औसत घनत्व।',
      common_reasons_low: ['आयरन की कमी', 'धीमा रक्तस्राव', 'कम आयरन भंडार'],
      common_reasons_high: ['गंभीर डिहाइड्रेशन', 'कोशिकाओं की असामान्य बनावट', 'लैब सैंपल का प्रभाव'],
      questions_for_doctor: ['क्या यह आयरन की जांच की ओर इशारा करता है?', 'क्या पर्याप्त पानी से सुधार संभव है?', 'क्या दोबारा जांच करानी होगी?'],
      language_reviewed: false
    }
  },
  {
    id: 'rdw_cv',
    area: 'blood',
    aliases: ['rdw-cv', 'rdw cv', 'rdw', 'red cell distribution width'],
    en: {
      display_name: 'RDW (Red Cell Distribution Width)',
      plain_meaning: 'A measure of how much your red blood cells vary in size from one another.',
      common_reasons_low: ['Cells are very uniform in size (usually a normal finding)'],
      common_reasons_high: ['Mixed cell sizes from early iron deficiency', 'Vitamin B12 or folate deficiency', 'Recent blood transfusion'],
      questions_for_doctor: ['Does a high RDW point to early nutritional changes?', 'Should we review iron and vitamin levels together?', 'Is any repeat testing needed?'],
      language_reviewed: true
    },
    te: {
      display_name: 'RDW (కణాల పరిమాణ వ్యత్యాసం)',
      plain_meaning: 'ఎర్ర రక్త కణాల పరిమాణాలలో తేడాలు లేదా వ్యత్యాసాన్ని తెలిపే కొలత.',
      common_reasons_low: ['అన్ని కణాలు ఒకే సైజులో సమానంగా ఉండటం (సాధారణం)'],
      common_reasons_high: ['ఐరన్ లోపం ప్రారంభ దశ', 'విటమిన్ బి12 లేదా ఫోలేట్ లోపం', 'ఇటీవల రక్తం ఎక్కించుకోవడం'],
      questions_for_doctor: ['ఇది ప్రారంభ విటమిన్ లేదా ఐరన్ లోపమా?', 'ఐరన్ మరియు బి12 పరీక్షలు కలిపి చూడాలా?', 'మళ్ళీ ఎప్పుడు పరీక్షించాలి?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'RDW (कोशिकाओं के आकार में अंतर)',
      plain_meaning: 'यह मापता है कि आपकी लाल रक्त कोशिकाएं आकार में एक दूसरे से कितनी अलग हैं।',
      common_reasons_low: ['सभी कोशिकाएं एक जैसे आकार की होना (सामान्य बात)'],
      common_reasons_high: ['आयरन की कमी की शुरुआत', 'विटामिन बी12 या फोलेट की कमी', 'हाल ही में खून चढ़ाया जाना'],
      questions_for_doctor: ['क्या यह पोषण या विटामिन में बदलाव का संकेत है?', 'क्या आयरन और विटामिन जांच साथ में देखनी चाहिए?', 'क्या दोबारा टेस्ट चाहिए?'],
      language_reviewed: false
    }
  },
  {
    id: 'neutrophils',
    area: 'blood',
    aliases: ['neutrophils', 'neutrophil count', 'polymorphs', 'segs'],
    en: {
      display_name: 'Neutrophils',
      plain_meaning: 'The most common type of white blood cell, acting as first responders against bacterial infections.',
      common_reasons_low: ['Recent viral illness', 'Certain medication effects', 'Autoimmune reactions'],
      common_reasons_high: ['Active bacterial infection', 'Acute physical stress or inflammation', 'Tissue healing after injury'],
      questions_for_doctor: ['Could this indicate an active bacterial infection?', 'Should we recheck this after symptoms resolve?', 'Are there any symptoms I should watch for?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Neutrophils (న్యూట్రోఫిల్స్)',
      plain_meaning: 'బాక్టీరియల్ ఇన్ఫెక్షన్లను ఎదుర్కొనే ప్రధాన రక్షణ తెల్ల రక్త కణాలు.',
      common_reasons_low: ['ఇటీవలి వైరల్ ఇన్ఫెక్షన్', 'కొన్ని ఔషధాల ప్రభావం', 'రోగనిరోధక మార్పులు'],
      common_reasons_high: ['శరీరంలో బాక్టీరియల్ ఇన్ఫెక్షన్', 'శారీరక ఒత్తిడి లేదా గాయం', 'శరీరంలో వాపు'],
      questions_for_doctor: ['ఇది బాక్టీరియల్ ఇన్ఫెక్షన్ వల్ల పెరిగిందా?', 'కొన్ని రోజుల తర్వాత మళ్ళీ పరీక్షించాలా?', 'నేను గమనించాల్సిన లక్షణాలు ఏమిటి?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Neutrophils (न्यूट्रोफिल्स)',
      plain_meaning: 'सफेद रक्त कोशिकाओं का मुख्य प्रकार जो बैक्टीरिया संक्रमण से तुरंत लड़ता है।',
      common_reasons_low: ['हालिया वायरल बीमारी', 'कुछ दवाओं का प्रभाव', 'इम्यून सिस्टम में बदलाव'],
      common_reasons_high: ['सक्रिय बैक्टीरिया संक्रमण', 'शारीरिक तनाव या सूजन', 'चोट या घाव भरने की प्रक्रिया'],
      questions_for_doctor: ['क्या यह किसी बैक्टीरिया संक्रमण का संकेत है?', 'क्या लक्षण ठीक होने पर दोबारा जांच करानी चाहिए?', 'मुझे किन लक्षणों पर ध्यान देना चाहिए?'],
      language_reviewed: false
    }
  },
  {
    id: 'lymphocytes',
    area: 'blood',
    aliases: ['lymphocytes', 'lymphocyte count', 'lymphs'],
    en: {
      display_name: 'Lymphocytes',
      plain_meaning: 'White blood cells that produce antibodies and provide targeted immunity against viral infections.',
      common_reasons_low: ['Recent intense physical stress', 'Steroid medication use', 'Malnutrition'],
      common_reasons_high: ['Recent or resolving viral infection (e.g. cold, flu, viral throat infection)', 'Chronic immune stimulation'],
      questions_for_doctor: ['Is this normal for recovering from a viral bug?', 'Does this need a follow-up test?', 'Should we recheck in 2-4 weeks?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Lymphocytes (లింఫోసైట్స్)',
      plain_meaning: 'వైరల్ ఇన్ఫెక్షన్లకు వ్యతిరేకంగా యాంటీబాడీలను తయారుచేసే రోగనిరోధక కణాలు.',
      common_reasons_low: ['శారీరక ఒత్తిడి', 'కొన్ని మందుల వాడకం', 'పోషకాహార లోపం'],
      common_reasons_high: ['ఇటీవలి వైరల్ జ్వరం లేదా జలుబు', 'శరీరంలో వైరస్ ఎదుర్కొనే ప్రతిస్పందన'],
      questions_for_doctor: ['వైరల్ జ్వరం నుండి కోలుకుంటున్నప్పుడు ఇది సహజమేనా?', 'కొన్ని వారాల తర్వాత మళ్ళీ పరీక్షించాలా?', 'నేను ఏదైనా జాగ్రత్త పడాలా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Lymphocytes (लिम्फोसाइट्स)',
      plain_meaning: 'सफेद रक्त कोशिकाएं जो एंटीबॉडी बनाती हैं और वायरल संक्रमण से बचाती हैं।',
      common_reasons_low: ['गंभीर शारीरिक तनाव', 'कुछ दवाओं का असर', 'पोषण की कमी'],
      common_reasons_high: ['हाल का वायरल संक्रमण (जैसे सर्दी, फ्लू या खांसी)', 'प्रतिरक्षा प्रणाली की सक्रियता'],
      questions_for_doctor: ['क्या वायरल से ठीक होते समय यह सामान्य है?', 'क्या 2-4 हफ्ते बाद दोबारा जांच करानी चाहिए?', 'आगे कोई जांच आवश्यक है?'],
      language_reviewed: false
    }
  },
  {
    id: 'monocytes',
    area: 'blood',
    aliases: ['monocytes', 'monocyte count', 'monos'],
    en: {
      display_name: 'Monocytes',
      plain_meaning: 'White blood cells that help clear damaged cells and fight long-term infections.',
      common_reasons_low: ['Temporary bone marrow suppression', 'Acute systemic illness'],
      common_reasons_high: ['Recovery phase after an infection', 'Ongoing inflammation in the body', 'Chronic bacterial or viral exposure'],
      questions_for_doctor: ['Could this reflect recovery from a recent illness?', 'Does this require any further testing?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Monocytes (మోనోసైట్స్)',
      plain_meaning: 'పాడైన కణాలను తొలగించి, దీర్ఘకాలిక ఇన్ఫెక్షన్లతో పోరాడే రక్షణ కణాలు.',
      common_reasons_low: ['తాత్కాలికంగా కణాల ఉత్పత్తి తగ్గడం', 'తీవ్ర అనారోగ్యం'],
      common_reasons_high: ['ఇన్ఫెక్షన్ తర్వాత శరీరం స్వస్థత పొందుతున్న సమయం', 'శరీరంలో దీర్ఘకాలిక వాపు'],
      questions_for_doctor: ['ఇటీవలి జ్వరం నుండి కోలుకోవడం వల్ల ఇది పెరిగిందా?', 'మరిన్ని పరీక్షలు అవసరమా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Monocytes (मोनोसाइट्स)',
      plain_meaning: 'सफेद रक्त कोशिकाएं जो क्षतिग्रस्त कोशिकाओं को साफ करने और पुरानी बीमारी से लड़ने में मदद करती हैं।',
      common_reasons_low: ['कोशिकाओं का अस्थायी रूप से कम बनना', 'तीव्र अस्वस्थता'],
      common_reasons_high: ['संक्रमण के बाद शरीर का ठीक होना', 'शरीर में सूजन का बने रहना'],
      questions_for_doctor: ['क्या यह हालिया बीमारी से उबरने का संकेत है?', 'क्या कोई अन्य टेस्ट कराने की आवश्यकता है?'],
      language_reviewed: false
    }
  },
  {
    id: 'eosinophils',
    area: 'blood',
    aliases: ['eosinophils', 'eosinophil count', 'eos'],
    en: {
      display_name: 'Eosinophils',
      plain_meaning: 'White blood cells involved in allergic reactions, asthma, and defense against parasites.',
      common_reasons_low: ['Acute bacterial infection stress', 'Steroid medication use'],
      common_reasons_high: ['Allergies (such as allergic rhinitis, eczema, skin rashes)', 'Asthma or respiratory allergies', 'Intestinal parasites'],
      questions_for_doctor: ['Could my allergies or skin reactions explain this?', 'Should we check for environmental or food allergies?', 'Does this level need treatment or monitoring?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Eosinophils (ఇసినోఫిల్స్)',
      plain_meaning: 'ఎలర్జీలు, ఆస్తమా మరియు పరాన్నజీవులతో పోరాడే రక్షణ తెల్ల రక్త కణాలు.',
      common_reasons_low: ['తీవ్రమైన బ్యాక్టీరియల్ ఇన్ఫెక్షన్ ఒత్తిడి', 'కొన్ని మందుల వాడకం'],
      common_reasons_high: ['ఎలర్జీలు (ముక్కు కారడం, చర్మంపై దద్దుర్లు, దురద)', 'ఆస్తమా లేదా శ్వాసకోశ ఎలర్జీ', 'కడుపులో నులిపురుగులు'],
      questions_for_doctor: ['నాకు ఉన్న ఎలర్జీ లేదా చర్మ సమస్యతో దీనికి సంబంధం ఉందా?', 'నులిపురుగుల పరీక్ష లేదా ఎలర్జీ పరీక్ష చేయించాలా?', 'మందులేవైనా అవసరమా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Eosinophils (इओसिनोफिल्स)',
      plain_meaning: 'सफेद रक्त कोशिकाएं जो एलर्जी, अस्थमा और परजीवी संक्रमण के खिलाफ काम करती हैं।',
      common_reasons_low: ['बैक्टीरिया संक्रमण का गंभीर तनाव', 'कुछ दवाओं का सेवन'],
      common_reasons_high: ['एलर्जी (जैसे छींक आना, त्वचा पर खुजली या चकत्ते)', 'अस्थमा या सांस की एलर्जी', 'पेट में कीड़े होना'],
      questions_for_doctor: ['क्या मेरी एलर्जी या त्वचा की समस्या से यह जुड़ा है?', 'क्या पेट के कीड़ों या एलर्जी की जांच करानी चाहिए?', 'क्या कोई दवा लेने की जरूरत है?'],
      language_reviewed: false
    }
  },
  {
    id: 'basophils',
    area: 'blood',
    aliases: ['basophils', 'basophil count', 'basos'],
    en: {
      display_name: 'Basophils',
      plain_meaning: 'Rare white blood cells that release histamine during inflammatory and allergic responses.',
      common_reasons_low: ['Normal physiological state (often naturally 0 to 1%)', 'Severe allergic reaction aftermath'],
      common_reasons_high: ['Chronic inflammation', 'Hypothyroidism', 'Rare bone marrow conditions'],
      questions_for_doctor: ['Is this small fluctuation clinically relevant?', 'Does this need any repeat check?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Basophils (బాసోఫిల్స్)',
      plain_meaning: 'శరీరంలో ఎలర్జీ మరియు వాపు వచ్చినప్పుడు హిస్టామిన్‌ను విడుదల చేసే అరుదైన రక్త కణాలు.',
      common_reasons_low: ['సహజంగా చాలా తక్కువగా ఉండటం (సాధారణం)'],
      common_reasons_high: ['శరీరంలో దీర్ఘకాలిక వాపు', 'థైరాయిడ్ సమస్యలు'],
      questions_for_doctor: ['ఈ చిన్న మార్పుకు ఏదైనా ప్రాముఖ్యత ఉందా?', 'మళ్ళీ ఎప్పుడు పరీక్షించాలి?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Basophils (बेसोफिल्स)',
      plain_meaning: 'रक्त कोशिकाएं जो एलर्जी और सूजन के दौरान हिस्टामाइन छोड़ती हैं।',
      common_reasons_low: ['सामान्य रूप से बहुत कम होना (स्वाभाविक)'],
      common_reasons_high: ['दीर्घकालिक सूजन', 'थायराइड की समस्या'],
      questions_for_doctor: ['क्या इस छोटे बदलाव का कोई खास मतलब है?', 'क्या दोबारा टेस्ट की जरूरत है?'],
      language_reviewed: false
    }
  },

  // =========================================================================
  // 2. BLOOD SUGAR & DIABETES (4 Tests)
  // =========================================================================
  {
    id: 'fasting_glucose',
    area: 'sugar',
    aliases: ['fasting blood sugar', 'fasting glucose', 'fbs', 'fasting blood glucose', 'glucose fasting'],
    en: {
      display_name: 'Fasting Blood Glucose',
      plain_meaning: 'The level of sugar circulating in your blood after an overnight fast of at least 8 hours.',
      common_reasons_low: ['Prolonged fasting or skipped meals', 'Excess physical exertion before test', 'Insulin or diabetes medications'],
      common_reasons_high: ['Insulin resistance or impaired glucose processing', 'Recent carbohydrate-heavy meals', 'High physical or mental stress'],
      questions_for_doctor: ['Does this reading indicate prediabetes or diabetes risk?', 'Should we verify with an HbA1c test?', 'Are lifestyle or meal adjustments advised?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Fasting Blood Glucose (పరగడుపున రక్తంలో చక్కెర)',
      plain_meaning: 'కనీసం 8 గంటల పాటు ఏమీ తినకుండా ఉన్నప్పుడు రక్తంలో ఉండే చక్కెర స్థాయి.',
      common_reasons_low: ['ఎక్కువ సమయం భోజనం చేయకపోవడం', 'పరీక్షకు ముందు అధిక శ్రమ', 'షుగర్ మందుల ప్రభావం'],
      common_reasons_high: ['శరీరంలో ఇన్సులిన్ సరిగ్గా పనిచేయకపోవడం', 'రాత్రి ఎక్కువ పిండి పదార్థాలు తినడం', 'తీవ్రమైన మానసిక లేదా శారీరక ఒత్తిడి'],
      questions_for_doctor: ['ఈ రీడింగ్ డయాబెటిస్ ప్రమాదాన్ని సూచిస్తుందా?', 'HbA1c పరీక్ష చేయించుకోవాలా?', 'ఆహారంలో ఎలాంటి మార్పులు చేసుకోవాలి?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Fasting Blood Glucose (खाली पेट ब्लड शुगर)',
      plain_meaning: 'कम से कम 8 घंटे बिना कुछ खाए रातभर के उपवास के बाद रक्त में मौजूद ग्लूकोज का स्तर।',
      common_reasons_low: ['लंबे समय तक भूखे रहना', 'जांच से पहले अधिक परिश्रम', 'डायबिटीज की दवा का असर'],
      common_reasons_high: ['इंसुलिन प्रतिरोध (शरीर में ग्लूकोज का सही इस्तेमाल न होना)', 'अधिक कार्बोहाइड्रेट वाला भोजन', 'तनाव या बीमारी'],
      questions_for_doctor: ['क्या यह डायबिटीज या प्रीडायबिटीज का संकेत है?', 'क्या HbA1c टेस्ट कराना चाहिए?', 'खान-पान में क्या बदलाव करने होंगे?'],
      language_reviewed: false
    }
  },
  {
    id: 'pp_glucose',
    area: 'sugar',
    aliases: ['postprandial blood sugar', 'post prandial glucose', 'ppbs', 'post-prandial blood sugar', 'glucose post prandial'],
    en: {
      display_name: 'Postprandial Blood Glucose (PPBS)',
      plain_meaning: 'The level of glucose in your blood measured exactly two hours after starting a meal.',
      common_reasons_low: ['Delayed stomach emptying', 'Excess insulin response after eating', 'Missed meal components'],
      common_reasons_high: ['High carbohydrate meal consumption', 'Sluggish insulin response after eating', 'Sedentary habits after meals'],
      questions_for_doctor: ['How well does my body manage sugar after meals?', 'Does my meal composition affect this number?', 'Should we check HbA1c?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Postprandial Glucose (భోజనం తర్వాత చక్కెర / PPBS)',
      plain_meaning: 'భోజనం చేసిన రెండు గంటల తర్వాత రక్తంలో ఉండే చక్కెర పరిమాణం.',
      common_reasons_low: ['ఆహారం ఆలస్యంగా జీర్ణం కావడం', 'భోజనం తర్వాత ఇన్సులిన్ వేగంగా విడుదల కావడం'],
      common_reasons_high: ['భోజనంలో పిండి పదార్థాలు మరియు చక్కెరలు ఎక్కువగా ఉండటం', 'శరీరం చక్కెరను నియంత్రించలేకపోవడం', 'శారీరక శ్రమ లేకపోవడం'],
      questions_for_doctor: ['భోజనం తర్వాత నా చక్కెర నియంత్రణ ఎలా ఉంది?', 'HbA1c పరీక్ష చేయించుకోవాలా?', 'ఆహారంలో ఏం మార్చుకోవాలి?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Postprandial Glucose (भोजन के बाद ब्लड शुगर / PPBS)',
      plain_meaning: 'खाना शुरू करने के ठीक दो घंटे बाद रक्त में शर्करा का मापा गया स्तर।',
      common_reasons_low: ['खाना धीरे पचना', 'खाने के बाद अधिक इंसुलिन बनना'],
      common_reasons_high: ['भोजन में अधिक मीठा या कार्बोहाइड्रेट होना', 'शरीर में इंसुलिन का धीमा काम करना', 'भोजन के बाद सुस्ती'],
      questions_for_doctor: ['भोजन के बाद मेरा शरीर शुगर कैसे नियंत्रित कर रहा है?', 'क्या खान-पान में बदलाव की जरूरत है?', 'क्या HbA1c देखना चाहिए?'],
      language_reviewed: false
    }
  },
  {
    id: 'random_glucose',
    area: 'sugar',
    aliases: ['random blood sugar', 'random glucose', 'rbs', 'blood sugar random'],
    en: {
      display_name: 'Random Blood Glucose',
      plain_meaning: 'Blood sugar measured at any random time of the day, regardless of when you last ate.',
      common_reasons_low: ['Skipped meal or prolonged exertion', 'Diabetes medication timing'],
      common_reasons_high: ['Recent sweet or heavy snack', 'Stress, fever, or infection', 'Impaired glucose tolerance'],
      questions_for_doctor: ['Does a fasting sugar check offer more precision?', 'Should I verify this with an HbA1c test?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Random Blood Glucose (ఏ సమయమైనా రక్తంలో చక్కెర)',
      plain_meaning: 'భోజన సమయంతో సంబంధం లేకుండా రోజులో ఏ సమయంలోనైనా కొలిచే రక్తంలో చక్కెర స్థాయి.',
      common_reasons_low: ['చాలా సమయం ఏమీ తినకపోవడం', 'షుగర్ మందుల సమయం మారడం'],
      common_reasons_high: ['పరీక్షకు కొద్దిసేపటి ముందే ఆహారం లేదా తీపి పదార్థాలు తినడం', 'జ్వరం లేదా ఒత్తిడి', 'షుగర్ నియంత్రణ లోపించడం'],
      questions_for_doctor: ['పరగడుపున (Fasting) పరీక్ష చేయించుకుంటే మరింత ఖచ్చితంగా తెలుస్తుందా?', 'HbA1c పరీక్ష అవసరమా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Random Blood Glucose (रैंडम ब्लड शुगर)',
      plain_meaning: 'दिन में किसी भी समय मापी गई ब्लड शुगर, चाहे खाना जब भी खाया हो।',
      common_reasons_low: ['खाना न खाना या भारी व्यायाम', 'दवाओं का समय'],
      common_reasons_high: ['जांच से कुछ देर पहले मीठा या भारी खाना', 'तनाव या बुखार', 'ब्लड शुगर का अनियंत्रित होना'],
      questions_for_doctor: ['क्या खाली पेट (Fasting) जांच कराना बेहतर रहेगा?', 'क्या मुझे HbA1c जांच करानी चाहिए?'],
      language_reviewed: false
    }
  },
  {
    id: 'hba1c',
    area: 'sugar',
    aliases: ['hba1c', 'glycated hemoglobin', 'glycosylated hemoglobin', 'hemoglobin a1c', 'a1c'],
    en: {
      display_name: 'HbA1c (Glycated Hemoglobin)',
      plain_meaning: 'Shows your average blood sugar level over the past 2 to 3 months by measuring sugar stuck to hemoglobin.',
      common_reasons_low: ['Frequent low blood sugar episodes', 'Hemolytic conditions or recent blood loss', 'High red cell turnover'],
      common_reasons_high: ['Consistently elevated daily blood sugar levels', 'Prediabetes or diabetes risk', 'Low physical activity over past months'],
      questions_for_doctor: ['What is my personalized target HbA1c level?', 'How does this compare with my daily glucose readings?', 'What steps help bring this into the target range?'],
      language_reviewed: true
    },
    te: {
      display_name: 'HbA1c (గత 3 నెలల సగటు చక్కెర)',
      plain_meaning: 'గత 2 నుండి 3 నెలల కాలంలో మీ రక్తంలో చక్కెర సగటున ఎలా ఉందో తెలిపే కీలక పరీక్ష.',
      common_reasons_low: ['తరచుగా షుగర్ స్థాయిలు పడిపోవడం', 'రక్త కణాలు త్వరగా మారడం'],
      common_reasons_high: ['గత కొద్ది నెలలుగా రక్తంలో చక్కెర స్థాయిలు ఎక్కువగా ఉండటం', 'డయాబెటిస్ లేదా ప్రీ-డయాబెటిస్ సంకేతం', 'శారీరక శ్రమ తక్కువగా ఉండటం'],
      questions_for_doctor: ['నా వయస్సు మరియు ఆరోగ్యానికి తగిన HbA1c లక్ష్యం ఎంత?', 'దీనిని అదుపులోకి తేవడానికి నేను ఏం చేయాలి?', 'ఎన్ని నెలల తర్వాత మళ్ళీ పరీక్షించాలి?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'HbA1c (पिछले 3 महीनों का औसत शुगर)',
      plain_meaning: 'पिछले 2 से 3 महीनों के दौरान आपके रक्त में शुगर का औसत स्तर दर्शाता है।',
      common_reasons_low: ['शुगर का बार-बार बहुत कम होना', 'खून की नई कोशिकाएं जल्दी बनना'],
      common_reasons_high: ['पिछले कुछ महीनों से ब्लड शुगर का लगातार बढ़ा रहना', 'प्रीडायबिटीज या डायबिटीज का संकेत', 'शारीरिक गतिविधि की कमी'],
      questions_for_doctor: ['मेरे लिए सही HbA1c लक्ष्य क्या होना चाहिए?', 'इसे सामान्य सीमा में लाने के लिए क्या करना होगा?', 'कितने महीने बाद दोबारा टेस्ट कराएं?'],
      language_reviewed: false
    }
  },

  // =========================================================================
  // 3. LIPID PROFILE & CHOLESTEROL (5 Tests)
  // =========================================================================
  {
    id: 'total_cholesterol',
    area: 'lipid',
    aliases: ['total cholesterol', 'cholesterol', 'serum cholesterol'],
    en: {
      display_name: 'Total Cholesterol',
      plain_meaning: 'The overall amount of cholesterol (both good and bad fats) traveling in your blood stream.',
      common_reasons_low: ['Severe malnutrition', 'Hyperthyroidism (overactive thyroid)', 'Chronic liver conditions'],
      common_reasons_high: ['Diet rich in saturated fats', 'Family genetics influencing lipid processing', 'Underactive thyroid gland'],
      questions_for_doctor: ['What is my ideal cholesterol target based on my health?', 'How do my good and bad cholesterol numbers balance out?', 'Are lifestyle modifications recommended?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Total Cholesterol (మొత్తం కొలెస్ట్రాల్)',
      plain_meaning: 'రక్తంలో తిరిగే మంచి మరియు చెడు కొవ్వుల మొత్తం పరిమాణం.',
      common_reasons_low: ['తీవ్రమైన పోషకాహార లోపం', 'థైరాయిడ్ అతిగా పనిచేయడం', 'కాలేయ సమస్యలు'],
      common_reasons_high: ['నూనెలు, వేపుళ్లు, సంతృప్త కొవ్వులు ఎక్కువగా తినడం', 'వంశపారంపర్య కారణాలు', 'థైరాయిడ్ మందగించడం'],
      questions_for_doctor: ['నా మొత్తం కొలెస్ట్రాల్ లక్ష్యం ఎంత ఉండాలి?', 'మంచి మరియు చెడు కొవ్వుల నిష్పత్తి ఎలా ఉంది?', 'జీవనశైలిలో ఎలాంటి మార్పులు చేయాలి?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Total Cholesterol (कुल कोलेस्ट्रॉल)',
      plain_meaning: 'आपके रक्त में मौजूद अच्छे और बुरे दोनों प्रकार के फैट (वसा) की कुल मात्रा।',
      common_reasons_low: ['गंभीर कुपोषण', 'थायराइड का जरूरत से ज्यादा सक्रिय होना', 'लिवर की कमजोरी'],
      common_reasons_high: ['अधिक तला-भुना या चिकनाई युक्त भोजन', 'पारिवारिक या आनुवंशिक प्रभाव', 'थायराइड का धीमा होना'],
      questions_for_doctor: ['मेरे लिए सुरक्षित कोलेस्ट्रॉल स्तर क्या होना चाहिए?', 'अच्छे और बुरे कोलेस्ट्रॉल का अनुपात कैसा है?', 'दिनचर्या में क्या सुधार करना चाहिए?'],
      language_reviewed: false
    }
  },
  {
    id: 'hdl_cholesterol',
    area: 'lipid',
    aliases: ['hdl cholesterol', 'hdl', 'high density lipoprotein'],
    en: {
      display_name: 'HDL Cholesterol ("Good" Cholesterol)',
      plain_meaning: 'Protective cholesterol that sweeps excess fat out of your blood vessels and back to the liver.',
      common_reasons_low: ['Lack of physical aerobic exercise', 'Smoking habits', 'Diet high in refined carbohydrates'],
      common_reasons_high: ['Regular physical aerobic exercise', 'Healthy unsaturated fat intake', 'Favorable genetics'],
      questions_for_doctor: ['How can I safely raise my HDL protective cholesterol?', 'What physical activities are most helpful?'],
      language_reviewed: true
    },
    te: {
      display_name: 'HDL Cholesterol (మంచి కొలెస్ట్రాల్)',
      plain_meaning: 'రక్తనాళాల నుండి అదనపు కొవ్వును కాలేయానికి చేర్చి గుండెను కాపాడే రక్షణ కొవ్వు.',
      common_reasons_low: ['రోజూ వ్యాయామం చేయకపోవడం', 'పొగతాగడం', 'శుద్ధి చేసిన పిండి పదార్థాలు ఎక్కువగా తినడం'],
      common_reasons_high: ['రోజూ క్రమం తప్పకుండా వ్యాయామం చేయడం', 'మంచి నూనెలు, గింజలు తినడం', 'వంశపారంపర్య రక్షణ'],
      questions_for_doctor: ['మంచి కొలెస్ట్రాల్‌ను పెంచుకోవడానికి నేను ఏ వ్యాయామం చేయాలి?', 'నా ఆహారంలో ఏం చేర్చుకోవాలి?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'HDL Cholesterol ("अच्छा" कोलेस्ट्रॉल)',
      plain_meaning: 'सुरक्षात्मक कोलेस्ट्रॉल जो रक्त की नसों से अतिरिक्त फैट को हटाकर लिवर तक पहुंचाता है।',
      common_reasons_low: ['व्यायाम या शारीरिक गतिविधि की कमी', 'धूम्रपान', 'रिफाइंड और मीठा खाना ज्यादा खाना'],
      common_reasons_high: ['नियमित रूप से व्यायाम या टहलना', 'स्वस्थ आहार और मेवे खाना', 'अच्छी आनुवंशिकी'],
      questions_for_doctor: ['अच्छा कोलेस्ट्रॉल बढ़ाने के लिए मुझे क्या करना चाहिए?', 'कौन सी कसरत सबसे ज्यादा असरदार होगी?'],
      language_reviewed: false
    }
  },
  {
    id: 'ldl_cholesterol',
    area: 'lipid',
    aliases: ['ldl cholesterol', 'ldl', 'low density lipoprotein'],
    en: {
      display_name: 'LDL Cholesterol ("Bad" Cholesterol)',
      plain_meaning: 'The type of cholesterol that can build up inside artery walls over time if elevated.',
      common_reasons_low: ['Low fat intake', 'Overactive thyroid', 'Liver processing variations'],
      common_reasons_high: ['High intake of saturated and trans fats', 'Physical inactivity', 'Familial hypercholesterolemia genes'],
      questions_for_doctor: ['What is my personalized LDL goal based on my overall risk?', 'Are dietary changes sufficient or do I need further checks?'],
      language_reviewed: true
    },
    te: {
      display_name: 'LDL Cholesterol (చెడు కొలెస్ట్రాల్)',
      plain_meaning: 'ఎక్కువైతే రక్తనాళాల గోడలలో పేరుకుపోయే ప్రమాదకరమైన కొవ్వు.',
      common_reasons_low: ['కొవ్వులు తక్కువగా తినడం', 'థైరాయిడ్ వేగంగా పనిచేయడం'],
      common_reasons_high: ['వేయించిన ఆహారాలు, డాల్డా, జంతు కొవ్వులు అధికంగా తీసుకోవడం', 'శారీరక శ్రమ లోపించడం', 'వంశపారంపర్య లక్షణాలు'],
      questions_for_doctor: ['నాకు LDL కొలెస్ట్రాల్ లక్ష్యం ఎంత ఉండాలి?', 'ఆహార మార్పులతో దీనిని తగ్గించవచ్చా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'LDL Cholesterol ("खराब" कोलेस्ट्रॉल)',
      plain_meaning: 'ऐसा कोलेस्ट्रॉल जो अधिक होने पर रक्त वाहिकाओं की दीवारों में जमा हो सकता है।',
      common_reasons_low: ['फैट की बहुत कम मात्रा', 'थायराइड का तेज काम करना'],
      common_reasons_high: ['तली-भुनी चीजें और ट्रांस फैट ज्यादा खाना', 'व्यायाम न करना', 'आनुवंशिक कारण'],
      questions_for_doctor: ['मेरे स्वास्थ्य के अनुसार LDL का सही स्तर क्या होना चाहिए?', 'क्या केवल खान-पान से इसे नियंत्रित किया जा सकता है?'],
      language_reviewed: false
    }
  },
  {
    id: 'triglycerides',
    area: 'lipid',
    aliases: ['triglycerides', 'tg', 'serum triglycerides'],
    en: {
      display_name: 'Triglycerides',
      plain_meaning: 'The most common form of stored fat in your body, derived from unused calories.',
      common_reasons_low: ['Very low fat or calorie diet', 'Malabsorption', 'Hyperthyroidism'],
      common_reasons_high: ['High consumption of sugars and refined carbs', 'Alcohol consumption', 'Lack of physical movement'],
      questions_for_doctor: ['How can I lower my triglycerides through meal timing?', 'Should this be retested after fasting strictly for 12 hours?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Triglycerides (ట్రైగ్లిజరైడ్స్ కొవ్వు)',
      plain_meaning: 'శరీరం ఉపయోగించని అదనపు కేలరీల నుండి తయారై నిల్వ ఉండే రక్తపు కొవ్వు.',
      common_reasons_low: ['చాలా తక్కువ కేలరీలు తినడం', 'ఆహారం సరిగ్గా వంటపట్టకపోవడం'],
      common_reasons_high: ['తీపి పదార్థాలు, బియ్యం, మైదా ఎక్కువగా తినడం', 'మద్యపానం', 'నడక లేదా శ్రమ లేకపోవడం'],
      questions_for_doctor: ['ఆహారంలో మార్పులతో ట్రైగ్లిజరైడ్స్ ఎలా తగ్గించుకోవచ్చు?', '12 గంటల ఉపవాసంతో మళ్ళీ పరీక్షించాలా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Triglycerides (ट्राइग्लिसराइड्स)',
      plain_meaning: 'शरीर में जमा होने वाला फैट, जो अतिरिक्त कैलोरी से बनता है।',
      common_reasons_low: ['बहुत कम कैलोरी या वसा वाला आहार', 'पाचन में कमजोरी'],
      common_reasons_high: ['मीठा, मैदा या रिफाइंड अनाज अधिक खाना', 'शराब का सेवन', 'शारीरिक गतिविधि की कमी'],
      questions_for_doctor: ['खान-पान में बदलाव से ट्राइग्लिसराइड्स कैसे कम करें?', 'क्या 12 घंटे के उपवास के बाद दोबारा टेस्ट कराना चाहिए?'],
      language_reviewed: false
    }
  },
  {
    id: 'vldl',
    area: 'lipid',
    aliases: ['vldl cholesterol', 'vldl'],
    en: {
      display_name: 'VLDL Cholesterol',
      plain_meaning: 'Very Low Density Lipoprotein produced by the liver to carry triglycerides to your body tissues.',
      common_reasons_low: ['Low dietary fat intake', 'High metabolic clearance'],
      common_reasons_high: ['High triglyceride levels', 'Excess simple sugars in diet', 'Alcohol intake'],
      questions_for_doctor: ['How does VLDL relate to my triglycerides reading?', 'What diet adjustments help normalize VLDL?'],
      language_reviewed: true
    },
    te: {
      display_name: 'VLDL Cholesterol (చాలా తక్కువ సాంద్రత గల కొవ్వు)',
      plain_meaning: 'కాలేయం తయారుచేసి శరీర కణాలకు ట్రైగ్లిజరైడ్లను మోసుకెళ్ళే కొవ్వు కణాలు.',
      common_reasons_low: ['ఆహారంలో తక్కువ కొవ్వు ఉండటం'],
      common_reasons_high: ['ట్రైగ్లిజరైడ్స్ ఎక్కువగా ఉండటం', 'తీపి పదార్థాలు ఎక్కువగా తినడం', 'మద్యం అలవాటు'],
      questions_for_doctor: ['ట్రైగ్లిజరైడ్స్‌తో దీనికి ఉన్న సంబంధం ఏమిటి?', 'దీనిని అదుపు చేయడానికి ఏం చేయాలి?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'VLDL Cholesterol (वीएलडीएल कोलेस्ट्रॉल)',
      plain_meaning: 'लिवर द्वारा बनाया गया फैट जो शरीर के अंगों तक ट्राइग्लिसराइड्स पहुंचाता है।',
      common_reasons_low: ['कम वसायुक्त आहार लेना'],
      common_reasons_high: ['ट्राइग्लिसराइड्स का अधिक स्तर', 'मीठा अधिक खाना', 'शराब का सेवन'],
      questions_for_doctor: ['इसका ट्राइग्लिसराइड्स से क्या संबंध है?', 'इसे सामान्य रखने के लिए क्या करें?'],
      language_reviewed: false
    }
  },

  // =========================================================================
  // 4. KIDNEY FUNCTION & RENAL PANEL (4 Tests)
  // =========================================================================
  {
    id: 'creatinine',
    area: 'kidney',
    aliases: ['serum creatinine', 'creatinine', 'sr creatinine'],
    en: {
      display_name: 'Serum Creatinine',
      plain_meaning: 'A natural muscle breakdown byproduct filtered out of your blood by healthy kidneys.',
      common_reasons_low: ['Lower muscle mass', 'Low dietary protein intake', 'Pregnancy'],
      common_reasons_high: ['Temporary dehydration (concentrated blood)', 'High intake of cooked red meat or creatine', 'Kidneys filtering at a slower rate'],
      questions_for_doctor: ['Does my creatinine level indicate healthy kidney filtering?', 'Could mild dehydration have raised this reading?', 'Should we check an estimated GFR or urine test?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Serum Creatinine (కిడ్నీ వడపోత వ్యర్థం / క్రియాటినిన్)',
      plain_meaning: 'కండరాల కదలికల వల్ల సహజంగా తయారై, మూత్రపిండాల ద్వారా రక్తం నుండి బయటకు వెళ్ళే వ్యర్థ పదార్థం.',
      common_reasons_low: ['కండరాల బలం తక్కువగా ఉండటం', 'ప్రోటీన్ తక్కువగా తినడం', 'గర్భధారణ సమయం'],
      common_reasons_high: ['తగినంత నీరు తాగకపోవడం (డీహైడ్రేషన్)', 'ఎక్కువ మాంసాహారం తినడం', 'కిడ్నీలు నెమ్మదిగా వడపోయడం'],
      questions_for_doctor: ['నా కిడ్నీల వడపోత పనితీరు ఎలా ఉంది?', 'నీరు తక్కువగా తాగడం వల్ల ఈ రీడింగ్ పెరిగిందా?', 'యూరిన్ లేదా eGFR పరీక్ష చేయించాలా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Serum Creatinine (सीरम क्रिएटिनिन)',
      plain_meaning: 'मांसपेशियों के सामान्य काम से बनने वाला अपशिष्ट पदार्थ, जिसे स्वस्थ गुर्दे (किडनी) छानकर बाहर निकालते हैं।',
      common_reasons_low: ['मांसपेशियों का कम होना', 'प्रोटीन कम खाना', 'गर्भावस्था'],
      common_reasons_high: ['पानी की कमी (डिहाइड्रेशन)', 'अधिक मांसाहार या प्रोटीन सप्लीमेंट', 'किडनी द्वारा छानने की गति धीमी होना'],
      questions_for_doctor: ['क्या मेरी किडनी ठीक से काम कर रही है?', 'क्या पानी कम पीने से यह मान बढ़ सकता है?', 'क्या कोई यूरिन टेस्ट या ईजीएफआर जांच जरूरी है?'],
      language_reviewed: false
    }
  },
  {
    id: 'blood_urea',
    area: 'kidney',
    aliases: ['blood urea nitrogen', 'bun', 'urea', 'serum urea', 'blood urea'],
    en: {
      display_name: 'Blood Urea / BUN',
      plain_meaning: 'A waste compound formed in the liver when protein is broken down and eliminated by your kidneys.',
      common_reasons_low: ['Low protein diet', 'Overhydration', 'Liver processing variations'],
      common_reasons_high: ['Dehydration (reduced fluid volume)', 'High protein dietary intake', 'Kidney excretion changes'],
      questions_for_doctor: ['Is my urea level in line with my creatinine reading?', 'Could drinking more fluids help normalize this?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Blood Urea (రక్తంలో యూరియా)',
      plain_meaning: 'ప్రోటీన్లు జీర్ణమైనప్పుడు కాలేయంలో తయారై, మూత్రపిండాల ద్వారా విసర్జించబడే వ్యర్థ పదార్థం.',
      common_reasons_low: ['ప్రోటీన్లు తక్కువగా తినడం', 'ఎక్కువ నీరు తాగడం'],
      common_reasons_high: ['శరీరంలో నీటి కొరత (డీహైడ్రేషన్)', 'అధిక ప్రోటీన్ ఆహారం తినడం', 'కిడ్నీల విసర్జన మందగించడం'],
      questions_for_doctor: ['క్రియాటినిన్‌తో పోలిస్తే యూరియా స్థాయి ఎలా ఉంది?', 'మంచినీరు ఎక్కువ తాగడం వల్ల ఇది తగ్గుతుందా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Blood Urea (ब्लड यूरिया)',
      plain_meaning: 'प्रोटीन पचने पर लिवर में बनने वाला अपशिष्ट, जिसे गुर्दे शरीर से बाहर निकालते हैं।',
      common_reasons_low: ['कम प्रोटीन वाला भोजन', 'बहुत अधिक पानी पीना'],
      common_reasons_high: ['शरीर में पानी की कमी (डिहाइड्रेशन)', 'अधिक प्रोटीन का सेवन', 'गुर्दों द्वारा उत्सर्जन धीमा होना'],
      questions_for_doctor: ['क्या यूरिया का स्तर क्रिएटिनिन से मेल खाता है?', 'क्या अधिक पानी पीने से इसमें सुधार होगा?'],
      language_reviewed: false
    }
  },
  {
    id: 'uric_acid',
    area: 'kidney',
    aliases: ['uric acid', 'serum uric acid'],
    en: {
      display_name: 'Uric Acid',
      plain_meaning: 'A byproduct created when your body breaks down natural chemicals called purines found in foods.',
      common_reasons_low: ['Low purine diet', 'Certain medications increasing excretion'],
      common_reasons_high: ['High intake of purine-rich foods (red meat, seafood, lentils)', 'Low fluid intake', 'Reduced kidney excretion'],
      questions_for_doctor: ['Could this reading cause joint discomfort or gout?', 'What dietary adjustments reduce purine load?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Uric Acid (యూరిక్ యాసిడ్)',
      plain_meaning: 'శరీరంలో ప్యూరిన్లు అనే సహజ పదార్థాలు జీర్ణమైనప్పుడు ఉత్పన్నమయ్యే రసాయనం.',
      common_reasons_low: ['ప్యూరిన్ తక్కువగా ఉండే ఆహారం తీసుకోవడం'],
      common_reasons_high: ['మాంసం, సీఫుడ్, పప్పులు ఎక్కువగా తినడం', 'తగినంత నీరు తాగకపోవడం', 'కీళ్లలో నొప్పులు వచ్చే అవకాశం'],
      questions_for_doctor: ['ఈ రీడింగ్ వల్ల కీళ్ల నొప్పులు లేదా గౌట్ సమస్య రావచ్చా?', 'ఆహారంలో ఎలాంటి మార్పులు చేసుకోవాలి?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Uric Acid (यूरिक एसिड)',
      plain_meaning: 'भोजन में मौजूद प्यूरीन नामक तत्वों के पचने पर बनने वाला स्वाभाविक अपशिष्ट।',
      common_reasons_low: ['कम प्यूरीन वाला सादा भोजन'],
      common_reasons_high: ['दालें, मांसाहार या सीफूड अधिक खाना', 'पानी कम पीना', 'जोड़ों में यूरिक एसिड जमा होना'],
      questions_for_doctor: ['क्या इससे जोड़ों में दर्द या गाउट का खतरा है?', 'यूरिक एसिड घटाने के लिए खान-पान में क्या बदलाव करें?'],
      language_reviewed: false
    }
  },
  {
    id: 'egfr',
    area: 'kidney',
    aliases: ['egfr', 'estimated gfr', 'glomerular filtration rate'],
    en: {
      display_name: 'eGFR (Estimated Kidney Filtration Rate)',
      plain_meaning: 'An estimated calculation of how efficiently your kidneys are clearing waste per minute.',
      common_reasons_low: ['Reduced kidney filtering efficiency', 'Dehydration', 'Age-related gradual changes'],
      common_reasons_high: ['Normal robust kidney filtering capacity (eGFR > 90 is typically optimal)'],
      questions_for_doctor: ['What stage of kidney function does my eGFR represent?', 'Are there simple steps to protect my kidney filtration?'],
      language_reviewed: true
    },
    te: {
      display_name: 'eGFR (కిడ్నీ వడపోత వేగం రేటు)',
      plain_meaning: 'మీ మూత్రపిండాలు నిమిషానికి ఎంత సమర్థవంతంగా రక్తాన్ని వడపోస్తున్నాయో తెలిపే అంచనా రేటు.',
      common_reasons_low: ['వడపోత వేగం మందగించడం', 'శరీరంలో నీటి కొరత', 'వయస్సుతో పాటు వచ్చే మార్పులు'],
      common_reasons_high: ['కిడ్నీలు ఆరోగ్యంగా, పూర్తి సామర్థ్యంతో పనిచేయడం (90 కంటే ఎక్కువ సాధారణం)'],
      questions_for_doctor: ['నా వయస్సు ప్రకారం ఈ వడపోత వేగం ఎలా ఉంది?', 'కిడ్నీల ఆరోగ్యాన్ని కాపాడుకోవడానికి ఏం చేయాలి?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'eGFR (किडनी फिल्ट्रेशन दर)',
      plain_meaning: 'यह दर्शाता है कि आपके गुर्दे प्रति मिनट कितनी कुशलता से रक्त को साफ कर रहे हैं।',
      common_reasons_low: ['छानने की क्षमता में कमी', 'पानी की कमी', 'उम्र के साथ स्वाभाविक बदलाव'],
      common_reasons_high: ['गुर्दों का बेहतरीन और सामान्य काम करना (90 से अधिक सामान्य)'],
      questions_for_doctor: ['मेरी उम्र के अनुसार यह दर कैसी है?', 'गुर्दों को स्वस्थ रखने के लिए क्या सलाह है?'],
      language_reviewed: false
    }
  },

  // =========================================================================
  // 5. LIVER FUNCTION & HEPATIC PANEL (7 Tests)
  // =========================================================================
  {
    id: 'total_bilirubin',
    area: 'liver',
    aliases: ['total bilirubin', 'serum bilirubin total', 'bilirubin total'],
    en: {
      display_name: 'Total Bilirubin',
      plain_meaning: 'A yellowish pigment created during the normal recycling of old red blood cells, processed by your liver.',
      common_reasons_low: ['Typically has no adverse clinical meaning'],
      common_reasons_high: ['Slow liver bile processing', 'Fasting or physical stress (Gilbert pattern)', 'Rapid breakdown of red blood cells'],
      questions_for_doctor: ['Could fasting or stress have influenced this bilirubin level?', 'Do I need an ultrasound or liver enzyme follow-up?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Total Bilirubin (పచ్చ కామెర్ల సూచిక / బిలిరుబిన్)',
      plain_meaning: 'పాత ఎర్ర రక్త కణాలు విచ్ఛిన్నమైనప్పుడు కాలేయం శుద్ధి చేసే పసుపు రంగు పదార్థం.',
      common_reasons_low: ['తక్కువగా ఉండటం వల్ల ఎలాంటి ఆరోగ్య సమస్య ఉండదు (సాధారణం)'],
      common_reasons_high: ['కాలేయం పిత్త రసాన్ని నెమ్మదిగా శుద్ధి చేయడం', 'ఉపవాసం లేదా శారీరక అలసట', 'ఎర్ర రక్త కణాలు త్వరగా నశించడం'],
      questions_for_doctor: ['ఉపవాసం లేదా అలసట వల్ల ఇది పెరిగిందా?', 'లివర్ ఎంజైములు లేదా అల్ట్రాసౌండ్ స్కానింగ్ అవసరమా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Total Bilirubin (पीलिया सूचक / बिलीरुबिन)',
      plain_meaning: 'पुरानी लाल रक्त कोशिकाओं के टूटने पर बनने वाला पीला तत्व, जिसे लिवर साफ करता है।',
      common_reasons_low: ['कम होना आमतौर पर पूरी तरह सामान्य है'],
      common_reasons_high: ['लिवर द्वारा इसे धीमे साफ करना', 'उपवास, थकान या तनाव', 'लाल कोशिकाओं का तेजी से टूटना'],
      questions_for_doctor: ['क्या उपवास या तनाव से यह स्तर बढ़ सकता है?', 'क्या अल्ट्रासाउंड या लिवर जांच की जरूरत है?'],
      language_reviewed: false
    }
  },
  {
    id: 'direct_bilirubin',
    area: 'liver',
    aliases: ['direct bilirubin', 'conjugated bilirubin'],
    en: {
      display_name: 'Direct Bilirubin',
      plain_meaning: 'The portion of bilirubin that has already been converted by the liver into a water-soluble form for bile.',
      common_reasons_low: ['Normal physiological state'],
      common_reasons_high: ['Slowed bile flow through liver ducts', 'Gallbladder or bile tract irritation'],
      questions_for_doctor: ['Does this indicate any bile drainage sluggishness?', 'Should we evaluate liver ultrasound imaging?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Direct Bilirubin (డైరెక్ట్ బిలిరుబిన్)',
      plain_meaning: 'కాలేయం శుద్ధి చేసి పిత్త రసంలోకి పంపే నీటిలో కరిగే బిలిరుబిన్ భాగం.',
      common_reasons_low: ['సహజమైన సాధారణ స్థితి'],
      common_reasons_high: ['పిత్త వాహికలలో ప్రవాహం నెమ్మదించడం', 'పిత్తాశయంలో మంట లేదా రాళ్ళు'],
      questions_for_doctor: ['పిత్త రసం ప్రవాహంలో ఏమైనా ఆటంకం ఉందా?', 'లివర్ స్కానింగ్ అవసరమా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Direct Bilirubin (डायरेक्ट बिलीरुबिन)',
      plain_meaning: 'बिलीरुबिन का वह भाग जिसे लिवर ने पानी में घुलनशील बनाकर पित्त में भेजा है।',
      common_reasons_low: ['सामान्य स्वाभाविक स्थिति'],
      common_reasons_high: ['पित्त की नलियों में बहाव धीमा होना', 'पित्ताशय में सूजन या रुकावट'],
      questions_for_doctor: ['क्या यह पित्त के बहाव में रुकावट का संकेत है?', 'क्या लिवर अल्ट्रासाउंड कराना चाहिए?'],
      language_reviewed: false
    }
  },
  {
    id: 'sgot_ast',
    area: 'liver',
    aliases: ['sgot', 'ast', 'aspartate aminotransferase', 'sgot/ast'],
    en: {
      display_name: 'SGOT / AST',
      plain_meaning: 'An enzyme found inside liver, heart, and muscle cells that releases into blood when cells are stressed.',
      common_reasons_low: ['Normal healthy finding'],
      common_reasons_high: ['Recent heavy muscular workout', 'Certain medications or alcohol exposure', 'Liver tissue stress or fatty liver changes'],
      questions_for_doctor: ['Could strenuous exercise prior to testing affect AST?', 'Should we recheck after 4 weeks?'],
      language_reviewed: true
    },
    te: {
      display_name: 'SGOT / AST (లివర్ మరియు కండరాల ఎంజైమ్)',
      plain_meaning: 'కాలేయం మరియు కండరాల కణాలలో ఉండే ఎంజైమ్; కణాలు ఒత్తిడికి గురైనప్పుడు రక్తంలోకి విడుదలవుతుంది.',
      common_reasons_low: ['సాధారణ ఆరోగ్యకరమైన స్థితి'],
      common_reasons_high: ['తీవ్రమైన వ్యాయామం లేదా కండరాల శ్రమ', 'కొన్ని మందులు లేదా మద్యం ప్రభావం', 'ఫ్యాటీ లివర్ లేదా కాలేయ అలసట'],
      questions_for_doctor: ['వ్యాయామం చేయడం వల్ల ఇది పెరిగిందా?', 'కొన్ని వారాల తర్వాత మళ్ళీ పరీక్షించాలా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'SGOT / AST (लिवर और मांसपेशी एंजाइम)',
      plain_meaning: 'लिवर और मांसपेशियों की कोशिकाओं में पाया जाने वाला एंजाइम, जो खिंचाव या तनाव होने पर खून में आता है।',
      common_reasons_low: ['पूरी तरह सामान्य स्थिति'],
      common_reasons_high: ['भारी कसरत या मांसपेशियों में खिंचाव', 'कुछ दवाओं या शराब का असर', 'फैटी लिवर या लिवर पर दबाव'],
      questions_for_doctor: ['क्या व्यायाम से यह स्तर बढ़ सकता है?', 'क्या 4 सप्ताह बाद दोबारा जांच करानी चाहिए?'],
      language_reviewed: false
    }
  },
  {
    id: 'sgpt_alt',
    area: 'liver',
    aliases: ['sgpt', 'alt', 'alanine aminotransferase', 'sgpt/alt'],
    en: {
      display_name: 'SGPT / ALT',
      plain_meaning: 'A specific liver enzyme that serves as a sensitive indicator of liver cell health.',
      common_reasons_low: ['Normal healthy baseline'],
      common_reasons_high: ['Fatty liver changes (hepatic steatosis)', 'Medications affecting liver metabolism', 'Recent alcohol intake or viral illness'],
      questions_for_doctor: ['Does this elevation suggest fatty liver evaluation?', 'What lifestyle changes best protect liver enzyme levels?'],
      language_reviewed: true
    },
    te: {
      display_name: 'SGPT / ALT (కాలేయ రక్షణ ఎంజైమ్)',
      plain_meaning: 'కాలేయ కణాల ఆరోగ్య స్థితిని ఖచ్చితంగా తెలిపే ప్రధాన కాలేయ ఎంజైమ్.',
      common_reasons_low: ['సాధారణ ఆరోగ్యకరమైన స్థితి'],
      common_reasons_high: ['కాలేయంలో కొవ్వు చేరడం (ఫ్యాటీ లివర్)', 'కొన్ని మందుల వాడకం', 'మద్యపానం లేదా వైరల్ ప్రభావం'],
      questions_for_doctor: ['ఇది ఫ్యాటీ లివర్ వల్ల పెరిగిందా?', 'కాలేయ ఆరోగ్యాన్ని కాపాడుకోవడానికి ఏం చేయాలి?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'SGPT / ALT (लिवर एंजाइम)',
      plain_meaning: 'लिवर की कोशिकाओं का खास एंजाइम जो लिवर के स्वास्थ्य का सटीक पैमाना है।',
      common_reasons_low: ['पूरी तरह सामान्य और स्वस्थ'],
      common_reasons_high: ['फैटी लिवर (लिवर में चर्बी जमा होना)', 'कुछ दवाओं का असर', 'शराब का सेवन या वायरल असर'],
      questions_for_doctor: ['क्या यह फैटी लिवर की ओर इशारा करता है?', 'लिवर को स्वस्थ रखने के लिए क्या बदलाव करें?'],
      language_reviewed: false
    }
  },
  {
    id: 'alp',
    area: 'liver',
    aliases: ['alkaline phosphatase', 'alp', 'serum alp'],
    en: {
      display_name: 'Alkaline Phosphatase (ALP)',
      plain_meaning: 'An enzyme linked to the bile ducts in your liver as well as bone growth and metabolism.',
      common_reasons_low: ['Nutritional zinc or magnesium deficiency', 'Hypothyroidism'],
      common_reasons_high: ['Sluggish bile flow in liver ducts', 'Bone healing or growth spurts', 'Pregnancy'],
      questions_for_doctor: ['Does this point toward bile flow or bone turnover?', 'Should we correlate with other liver tests?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Alkaline Phosphatase (పిత్త వాహిక మరియు ఎముకల ఎంజైమ్ / ALP)',
      plain_meaning: 'కాలేయ పిత్త వాహికలు మరియు ఎముకల పెరుగుదలకు సంబంధించిన కీలకమైన ఎంజైమ్.',
      common_reasons_low: ['జింక్ లేదా మెగ్నీషియం లోపం', 'థైరాయిడ్ మందగించడం'],
      common_reasons_high: ['పిత్త వాహికలలో ప్రవాహం నెమ్మదించడం', 'ఎముకల పెరుగుదల లేదా నయం కావడం', 'గర్భధారణ సమయం'],
      questions_for_doctor: ['ఇది కాలేయానికి సంబంధించినదా లేక ఎముకలదా?', 'ఇతర లివర్ పరీక్షలతో కలిపి చూడాలా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Alkaline Phosphatase (पित्त नली और हड्डी एंजाइम / ALP)',
      plain_meaning: 'पित्त की नलियों और हड्डियों के स्वास्थ्य से जुड़ा एक प्रमुख एंजाइम।',
      common_reasons_low: ['जिंक या मैग्नीशियम की कमी', 'थायराइड का धीमा होना'],
      common_reasons_high: ['पित्त के बहाव में रुकावट', 'हड्डियों का तेजी से बनना या जुड़ना', 'गर्भावस्था'],
      questions_for_doctor: ['क्या यह लिवर से संबंधित है या हड्डियों से?', 'क्या अन्य लिवर रिपोर्ट से इसे मिलाना चाहिए?'],
      language_reviewed: false
    }
  },
  {
    id: 'total_protein',
    area: 'liver',
    aliases: ['total protein', 'serum total protein', 'protein total'],
    en: {
      display_name: 'Total Protein',
      plain_meaning: 'The overall sum of two major types of proteins in your bloodstream: albumin and globulin.',
      common_reasons_low: ['Malnutrition or low protein intake', 'Liver synthesis reduction', 'Digestive malabsorption'],
      common_reasons_high: ['Dehydration concentrating the blood', 'Chronic active immune stimulation'],
      questions_for_doctor: ['Are my albumin and globulin components balanced?', 'Does this need dietary protein review?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Total Protein (రక్తంలో మొత్తం ప్రోటీన్లు)',
      plain_meaning: 'రక్తంలో ఉండే ఆల్బుమిన్ మరియు గ్లోబులిన్ అనే రెండు ప్రధాన ప్రోటీన్ల మొత్తం మొత్తం.',
      common_reasons_low: ['ఆహారంలో ప్రోటీన్ లోపం', 'కాలేయం ప్రోటీన్ తయారుచేయడం తగ్గడం', 'జీర్ణవ్యవస్థలో సరిగ్గా పీల్చుకోకపోవడం'],
      common_reasons_high: ['డీహైడ్రేషన్ వల్ల రక్తం చిక్కబడటం', 'దీర్ఘకాలిక ఇన్ఫెక్షన్లు'],
      questions_for_doctor: ['ఆల్బుమిన్ మరియు గ్లోబులిన్ నిష్పత్తి బాగుందా?', 'ఆహారంలో ప్రోటీన్లు పెంచాలా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Total Protein (कुल प्रोटीन)',
      plain_meaning: 'रक्त में पाए जाने वाले दो प्रमुख प्रोटीनों (एल्ब्यूमिन और ग्लोब्युलिन) की कुल मात्रा।',
      common_reasons_low: ['भोजन में प्रोटीन की कमी', 'लिवर द्वारा कम प्रोटीन बनना', 'पाचन में अवशोषण की कमी'],
      common_reasons_high: ['पानी की कमी से खून का गाढ़ा होना', 'दीर्घकालिक संक्रमण'],
      questions_for_doctor: ['क्या एल्ब्यूमिन और ग्लोब्युलिन का संतुलन सही है?', 'क्या भोजन में प्रोटीन बढ़ाना चाहिए?'],
      language_reviewed: false
    }
  },
  {
    id: 'albumin',
    area: 'liver',
    aliases: ['albumin', 'serum albumin'],
    en: {
      display_name: 'Serum Albumin',
      plain_meaning: 'A primary protein made by the liver that keeps fluid from leaking out of your blood vessels.',
      common_reasons_low: ['Inadequate nutritional protein intake', 'Liver synthesizing fewer proteins', 'Kidney losing protein into urine'],
      common_reasons_high: ['Dehydration (lower water volume in bloodstream)'],
      questions_for_doctor: ['Does my albumin reflect good nutritional and liver status?', 'Could dehydration explain this level?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Serum Albumin (ఆల్బుమిన్ ప్రోటీన్)',
      plain_meaning: 'రక్తనాళాల నుండి ద్రవాలు బయటకు లీక్ కాకుండా ఆపి శరీరంలో ఉంచే ప్రధాన కాలేయ ప్రోటీన్.',
      common_reasons_low: ['పోషకాహార లోపం', 'కాలేయ ఉత్పత్తి తగ్గడం', 'మూత్రంలో ప్రోటీన్ పోవడం'],
      common_reasons_high: ['శరీరంలో నీరు తగ్గడం (డీహైడ్రేషన్)'],
      questions_for_doctor: ['నా పోషకాహారం మరియు కాలేయం పనితీరు బాగుందా?', 'మంచినీరు తాగడం వల్ల మార్పు వస్తుందా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Serum Albumin (एल्ब्यूमिन प्रोटीन)',
      plain_meaning: 'लिवर द्वारा बनाया गया मुख्य प्रोटीन जो रक्त वाहिकाओं से पानी को बाहर रिसने से रोकता है।',
      common_reasons_low: ['प्रोटीन युक्त आहार की कमी', 'लिवर द्वारा कम बनना', 'पेशाब के रास्ते प्रोटीन निकलना'],
      common_reasons_high: ['शरीर में पानी की कमी (डिहाइड्रेशन)'],
      questions_for_doctor: ['क्या मेरा पोषण और लिवर स्वास्थ्य सामान्य है?', 'क्या पानी की कमी से यह बढ़ा है?'],
      language_reviewed: false
    }
  },

  // =========================================================================
  // 6. THYROID PANEL (5 Tests)
  // =========================================================================
  {
    id: 'tsh',
    area: 'thyroid',
    aliases: ['tsh', 'thyroid stimulating hormone', 'serum tsh', 'ultra tsh'],
    en: {
      display_name: 'TSH (Thyroid Stimulating Hormone)',
      plain_meaning: 'A pituitary messenger hormone that signals your thyroid gland how much thyroid hormone to produce.',
      common_reasons_low: ['Overactive thyroid gland (hyperthyroidism)', 'Excess thyroid hormone replacement medication'],
      common_reasons_high: ['Underactive thyroid gland (hypothyroidism)', 'Recovery phase after thyroiditis', 'Iodine deficiency'],
      questions_for_doctor: ['Does this TSH level indicate an underactive or overactive thyroid?', 'Should we test Free T3 and Free T4?', 'Will this need monitoring or medication review?'],
      language_reviewed: true
    },
    te: {
      display_name: 'TSH (థైరాయిడ్ ప్రేరేపక హార్మోన్)',
      plain_meaning: 'థైరాయిడ్ గ్రంథిని ఎంత హార్మోన్ ఉత్పత్తి చేయాలో సూచించే మెదడు పిట్యూటరీ హార్మోన్.',
      common_reasons_low: ['థైరాయిడ్ అతిగా వేగంగా పనిచేయడం (హైపర్‌థైరాయిడిజం)', 'థైరాయిడ్ మందుల డోస్ ఎక్కువ కావడం'],
      common_reasons_high: ['థైరాయిడ్ మందగించడం (హైపోథైరాయిడిజం)', 'శరీరానికి తగినంత థైరాయిడ్ హార్మోన్ అందకపోవడం'],
      questions_for_doctor: ['ఈ రీడింగ్ థైరాయిడ్ మందగించడాన్ని సూచిస్తుందా?', 'Free T3, Free T4 పరీక్షలు చేయించాలా?', 'మందుల వాడకం అవసరమా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'TSH (थायराइड प्रेरक हार्मोन)',
      plain_meaning: 'पिट्यूटरी ग्रंथि द्वारा जारी हार्मोन जो थायराइड को हार्मोन बनाने का संकेत देता है।',
      common_reasons_low: ['थायराइड का जरूरत से ज्यादा सक्रिय होना (हाइपरथायरायडिज्म)', 'दवा की अधिक खुराक'],
      common_reasons_high: ['थायराइड का सुस्त होना (हाइपोथायरायडिज्म)', 'शरीर में थायराइड हार्मोन की कमी'],
      questions_for_doctor: ['क्या यह सुस्त या तेज थायराइड का संकेत है?', 'क्या Free T3 और Free T4 जांच करानी चाहिए?', 'क्या दवा शुरू करने या बदलने की जरूरत है?'],
      language_reviewed: false
    }
  },
  {
    id: 'total_t3',
    area: 'thyroid',
    aliases: ['total t3', 'triiodothyronine', 't3'],
    en: {
      display_name: 'Total T3',
      plain_meaning: 'The active metabolic thyroid hormone circulating in your blood, measuring both bound and free forms.',
      common_reasons_low: ['Underactive thyroid state', 'Severe systemic illness (non-thyroidal illness)'],
      common_reasons_high: ['Overactive thyroid gland', 'Excess thyroid hormone medication'],
      questions_for_doctor: ['How does T3 correlate with my TSH level?', 'Does this need confirmation with Free T3?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Total T3 (మొత్తం T3 హార్మోన్)',
      plain_meaning: 'శరీర జీవక్రియల వేగాన్ని నియంత్రించే క్రియాశీల థైరాయిడ్ హార్మోన్.',
      common_reasons_low: ['థైరాయిడ్ పనితీరు తగ్గడం', 'తీవ్రమైన అనారోగ్యం'],
      common_reasons_high: ['థైరాయిడ్ అతిగా పనిచేయడం', 'థైరాయిడ్ హార్మోన్ మందుల ప్రభావం'],
      questions_for_doctor: ['TSHతో కలిపి T3 ఫలితం ఎలా ఉంది?', 'Free T3 పరీక్ష అవసరమా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Total T3 (कुल T3 हार्मोन)',
      plain_meaning: 'शरीर के मेटाबॉलिज्म (ऊर्जा खपत) को नियंत्रित करने वाला सक्रिय थायराइड हार्मोन।',
      common_reasons_low: ['थायराइड का धीमा काम करना', 'गंभीर शारीरिक अस्वस्थता'],
      common_reasons_high: ['थायराइड का तेज काम करना', 'थायराइड दवा का असर'],
      questions_for_doctor: ['TSH के साथ T3 का क्या तालमेल है?', 'क्या Free T3 जांच आवश्यक है?'],
      language_reviewed: false
    }
  },
  {
    id: 'total_t4',
    area: 'thyroid',
    aliases: ['total t4', 'thyroxine', 't4', 'serum t4'],
    en: {
      display_name: 'Total T4',
      plain_meaning: 'The primary storage hormone produced by your thyroid gland, converted into active T3 in body tissues.',
      common_reasons_low: ['Underactive thyroid', 'Protein deficiency affecting hormone carriers'],
      common_reasons_high: ['Overactive thyroid', 'High estrogen states or pregnancy'],
      questions_for_doctor: ['Does my T4 level explain my metabolism or energy levels?', 'Is Free T4 recommended for clarity?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Total T4 (థైరాక్సిన్ హార్మోన్)',
      plain_meaning: 'థైరాయిడ్ గ్రంథి తయారుచేసే ప్రధాన నిల్వ హార్మోన్; శరీరంలో ఇది T3గా మారుతుంది.',
      common_reasons_low: ['థైరాయిడ్ గ్రంథి నెమ్మదించడం', 'ప్రోటీన్ లోపం'],
      common_reasons_high: ['థైరాయిడ్ అతిగా పనిచేయడం', 'గర్భధారణ సమయం'],
      questions_for_doctor: ['నా శరీర శక్తి లేదా అలసటకు T4 కారణమా?', 'Free T4 పరీక్ష చేయించాలా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Total T4 (थायरोक्सिन)',
      plain_meaning: 'थायराइड ग्रंथि द्वारा बनाया जाने वाला मुख्य हार्मोन, जो शरीर में T3 में बदलता है।',
      common_reasons_low: ['थायराइड की सुस्ती', 'हार्मोन वाहक प्रोटीन की कमी'],
      common_reasons_high: ['थायराइड की अति-सक्रियता', 'गर्भावस्था'],
      questions_for_doctor: ['क्या यह मेरी ऊर्जा या वजन से जुड़ा है?', 'क्या Free T4 टेस्ट कराना चाहिए?'],
      language_reviewed: false
    }
  },
  {
    id: 'free_t3',
    area: 'thyroid',
    aliases: ['free t3', 'ft3'],
    en: {
      display_name: 'Free T3',
      plain_meaning: 'The unbound, active fraction of T3 that enters cells directly to regulate your metabolic rate.',
      common_reasons_low: ['Underactive thyroid', 'Illness slowing peripheral hormone conversion'],
      common_reasons_high: ['Overactive thyroid (hyperthyroidism)'],
      questions_for_doctor: ['Does this active hormone reading clarify my symptoms?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Free T3 (క్రియాశీల ఫ్రీ T3)',
      plain_meaning: 'కణాలలోకి నేరుగా వెళ్లి శరీర వేగాన్ని నియంత్రించే విముక్త థైరాయిడ్ హార్మోన్.',
      common_reasons_low: ['థైరాయిడ్ పనితీరు మందగించడం', 'శరీరంలో హార్మోన్ మార్పిడి తగ్గడం'],
      common_reasons_high: ['థైరాయిడ్ అతిగా పనిచేయడం'],
      questions_for_doctor: ['నా లక్షణాలకు ఈ హార్మోన్ స్థాయి కారణమా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Free T3 (फ्री T3)',
      plain_meaning: 'T3 का वह सक्रिय हिस्सा जो सीधे कोशिकाओं में जाकर ऊर्जा को नियंत्रित करता है।',
      common_reasons_low: ['थायराइड का धीमा होना', 'हार्मोन का सही इस्तेमाल न होना'],
      common_reasons_high: ['थायराइड का अत्यधिक सक्रिय होना'],
      questions_for_doctor: ['क्या यह मेरे लक्षणों की सही वजह स्पष्ट करता है?'],
      language_reviewed: false
    }
  },
  {
    id: 'free_t4',
    area: 'thyroid',
    aliases: ['free t4', 'ft4'],
    en: {
      display_name: 'Free T4',
      plain_meaning: 'The unbound, active form of thyroxine freely available for your body tissues to use.',
      common_reasons_low: ['Underactive thyroid gland (hypothyroidism)'],
      common_reasons_high: ['Overactive thyroid gland (hyperthyroidism)'],
      questions_for_doctor: ['Does my Free T4 indicate a need for thyroid support or dose adjustment?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Free T4 (క్రియాశీల ఫ్రీ T4)',
      plain_meaning: 'శరీర కణాలకు అందుబాటులో ఉండే స్వచ్ఛమైన క్రియాశీల థైరాక్సిన్ హార్మోన్.',
      common_reasons_low: ['థైరాయిడ్ మందగించడం (హైపోథైరాయిడిజం)'],
      common_reasons_high: ['థైరాయిడ్ అతిగా పనిచేయడం (హైపర్‌థైరాయిడిజం)'],
      questions_for_doctor: ['మందుల డోస్ సరిచేయడానికి ఈ రీడింగ్ ఉపయోగపడుతుందా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Free T4 (फ्री T4)',
      plain_meaning: 'थायरोक्सिन का सक्रिय रूप जो शरीर की कोशिकाओं के उपयोग के लिए तुरंत उपलब्ध होता है।',
      common_reasons_low: ['थायराइड की सुस्ती (हाइपोथायरायडिज्म)'],
      common_reasons_high: ['थायराइड की तेजी (हाइपरथायरायडिज्म)'],
      questions_for_doctor: ['क्या दवा की खुराक तय करने के लिए यह रीडिंग जरूरी है?'],
      language_reviewed: false
    }
  },

  // =========================================================================
  // 7. VITAMINS & MINERALS (3 Tests)
  // =========================================================================
  {
    id: 'vitamin_d3',
    area: 'vitamins',
    aliases: ['vitamin d3', 'vitamin d', '25-hydroxy vitamin d', '25-oh vitamin d', 'cholecalciferol'],
    en: {
      display_name: 'Vitamin D3 (25-OH)',
      plain_meaning: 'An essential nutrient that helps your body absorb calcium to maintain strong bones and immune defense.',
      common_reasons_low: ['Limited exposure to natural sunlight', 'Low dietary intake of fortified foods', 'Digestive malabsorption'],
      common_reasons_high: ['Excessive high-dose supplementation over long periods'],
      questions_for_doctor: ['Is my vitamin D level adequate for bone and muscle health?', 'Do you recommend sunlight exposure or a supplement check?', 'When should we recheck this level?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Vitamin D3 (ఎముకల విటమిన్ డి3)',
      plain_meaning: 'ఎముకలు బలంగా ఉండటానికి మరియు కాల్షియం పీల్చుకోవడానికి సహాయపడే ముఖ్యమైన విటమిన్.',
      common_reasons_low: ['ఎండ తగలకపోవడం', 'ఆహారంలో విటమిన్ డి లోపం', 'శరీరం విటమిన్‌ను పీల్చుకోలేకపోవడం'],
      common_reasons_high: ['అధిక మోతాదులో సప్లిమెంట్లు ఎక్కువ కాలం వాడటం'],
      questions_for_doctor: ['ఎముకల దృఢత్వానికి ఈ విటమిన్ సరిపోతుందా?', 'ఎండలో ఉండాలా లేక సప్లిమెంట్ వాడాలా?', 'ఎప్పుడు మళ్ళీ పరీక్షించాలి?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Vitamin D3 (हड्डियों का विटामिन D3)',
      plain_meaning: 'शरीर में कैल्शियम को सोखने और हड्डियों को मजबूत रखने के लिए आवश्यक महत्वपूर्ण विटामिन।',
      common_reasons_low: ['धूप में कम समय बिताना', 'खान-पान में विटामिन D की कमी', 'शरीर द्वारा सही अवशोषण न होना'],
      common_reasons_high: ['लंबे समय तक बहुत ज्यादा सप्लीमेंट का सेवन'],
      questions_for_doctor: ['क्या यह स्तर हड्डियों और मांसपेशियों के लिए सही है?', 'क्या मुझे धूप या सप्लीमेंट की सलाह दी जाती है?', 'कब दोबारा जांच कराएं?'],
      language_reviewed: false
    }
  },
  {
    id: 'vitamin_b12',
    area: 'vitamins',
    aliases: ['vitamin b12', 'b12', 'cyanocobalamin', 'serum b12'],
    en: {
      display_name: 'Vitamin B12',
      plain_meaning: 'A vital vitamin crucial for nerve function, brain health, and red blood cell production.',
      common_reasons_low: ['Strict vegetarian or vegan diets without supplementation', 'Stomach acid or intrinsic factor absorption issues', 'Certain long-term medications'],
      common_reasons_high: ['Recent B12 vitamin supplementation or injection', 'Liver conditions releasing stored B12'],
      questions_for_doctor: ['Could low B12 be causing fatigue or tingling in hands/feet?', 'Do I need dietary adjustments or supplementation?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Vitamin B12 (నరాల విటమిన్ బి12)',
      plain_meaning: 'నరాల పనితీరు, మెదడు చురుకుదనం మరియు ఎర్ర రక్త కణాల తయారీకి అవసరమైన కీలక విటమిన్.',
      common_reasons_low: ['శాకాహారంలో బి12 లభించకపోవడం', 'జీర్ణవ్యవస్థలో బి12 పీల్చుకోలేకపోవడం', 'కొన్ని మందుల దీర్ఘకాలిక వాడకం'],
      common_reasons_high: ['ఇటీవల బి12 మందులు లేదా ఇంజెక్షన్ తీసుకోవడం', 'కాలేయంలో నిల్వలు విడుదల కావడం'],
      questions_for_doctor: ['కాళ్ళు చేతులు తిమ్మిర్లు లేదా అలసటకు బి12 లోపం కారణమా?', 'సప్లిమెంట్ తీసుకోవాలా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Vitamin B12 (तंत्रिका विटामिन B12)',
      plain_meaning: 'नसों के स्वास्थ्य, मस्तिष्क की कार्यप्रणाली और रक्त निर्माण के लिए जरूरी विटामिन।',
      common_reasons_low: ['शुद्ध शाकाहारी भोजन में बी12 की कमी', 'पेट में अवशोषण की समस्या', 'कुछ पुरानी दवाएं'],
      common_reasons_high: ['हाल में बी12 सप्लीमेंट या इंजेक्शन लेना', 'लिवर से अतिरिक्त बी12 निकलना'],
      questions_for_doctor: ['क्या थकान या हाथ-पैरों में झनझनाहट का कारण बी12 हो सकता है?', 'क्या सप्लीमेंट लेना चाहिए?'],
      language_reviewed: false
    }
  },
  {
    id: 'calcium',
    area: 'vitamins',
    aliases: ['serum calcium', 'calcium', 'total calcium'],
    en: {
      display_name: 'Serum Calcium',
      plain_meaning: 'A vital mineral essential for bone strength, heart muscle rhythm, and nerve signaling.',
      common_reasons_low: ['Vitamin D deficiency', 'Low dietary calcium intake', 'Underactive parathyroid gland'],
      common_reasons_high: ['Overactive parathyroid gland (hyperparathyroidism)', 'Excess calcium/vitamin D intake', 'Prolonged immobility'],
      questions_for_doctor: ['Is my calcium level appropriate for bone health?', 'Should we correlate calcium with my vitamin D reading?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Serum Calcium (ఎముకల కాల్షియం ఖనిజం)',
      plain_meaning: 'ఎముకల బలం, గుండె లయ మరియు నరాల స్పందనలకు అత్యంత అవసరమైన ఖనిజం.',
      common_reasons_low: ['విటమిన్ డి లోపం', 'ఆహారంలో కాల్షియం లోపం', 'పారాథైరాయిడ్ సమస్యలు'],
      common_reasons_high: ['పారాథైరాయిడ్ అతిగా పనిచేయడం', 'ఎక్కువ కాల్షియం సప్లిమెంట్లు వాడటం'],
      questions_for_doctor: ['ఎముకల ఆరోగ్యానికి కాల్షియం స్థాయి బాగుందా?', 'విటమిన్ డితో కలిపి దీనిని చూడాలా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Serum Calcium (कैल्शियम)',
      plain_meaning: 'हड्डियों की मजबूती, हृदय की धड़कन और नसों के काम के लिए जरूरी प्रमुख खनिज।',
      common_reasons_low: ['विटामिन D की कमी', 'भोजन में कैल्शियम की कमी', 'पैराथायराइड की समस्या'],
      common_reasons_high: ['पैराथायराइड ग्रंथि का तेज काम करना', 'सप्लीमेंट्स का अधिक सेवन'],
      questions_for_doctor: ['क्या मेरी हड्डियों के लिए यह स्तर सही है?', 'क्या इसे विटामिन D के साथ देखना चाहिए?'],
      language_reviewed: false
    }
  },

  // =========================================================================
  // 8. ELECTROLYTES (3 Tests)
  // =========================================================================
  {
    id: 'sodium',
    area: 'electrolytes',
    aliases: ['serum sodium', 'sodium', 'na+'],
    en: {
      display_name: 'Serum Sodium',
      plain_meaning: 'An electrolyte that balances the amount of water in your body and supports nerve function.',
      common_reasons_low: ['Excess water intake relative to sodium', 'Certain water medications (diuretics)', 'Severe vomiting or diarrhea'],
      common_reasons_high: ['Dehydration (inadequate fluid intake)', 'Excessive salt intake', 'High fluid loss through sweating'],
      questions_for_doctor: ['Could my fluid intake explain this sodium level?', 'Does my blood pressure or medication affect this?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Serum Sodium (రక్తంలో సోడియం / ఉప్పు)',
      plain_meaning: 'శరీరంలో నీటి సమతుల్యతను మరియు నరాల సంకేతాలను కాపాడే ముఖ్యమైన లవణం.',
      common_reasons_low: ['శరీరంలో నీరు ఎక్కువై ఉప్పు తగ్గడం', 'మూత్రం ఎక్కువ వచ్చే మందులు', 'వాంతులు లేదా విరేచనాలు'],
      common_reasons_high: ['నీరు తక్కువగా తాగడం (డీహైడ్రేషన్)', 'ఉప్పు ఎక్కువగా తినడం', 'చెమట ద్వారా నీరు పోవడం'],
      questions_for_doctor: ['నీరు తాగే విధానంతో దీనికి సంబంధం ఉందా?', 'బీపీ మందుల వల్ల ఇందులో మార్పు వచ్చిందా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Serum Sodium (सोडियम)',
      plain_meaning: 'शरीर में पानी का संतुलन बनाए रखने और नसों के संचालन के लिए आवश्यक इलेक्ट्रोलाइट।',
      common_reasons_low: ['शरीर में पानी बढ़ना और नमक घटना', 'पेशाब बढ़ाने वाली दवाएं', 'उल्टी या दस्त'],
      common_reasons_high: ['पानी कम पीना (डिहाइड्रेशन)', 'अधिक नमक का सेवन', 'पसीने से तरल की कमी'],
      questions_for_doctor: ['क्या पानी की मात्रा से इस पर असर पड़ा है?', 'क्या मेरी बीपी की दवा इससे जुड़ी है?'],
      language_reviewed: false
    }
  },
  {
    id: 'potassium',
    area: 'electrolytes',
    aliases: ['serum potassium', 'potassium', 'k+'],
    en: {
      display_name: 'Serum Potassium',
      plain_meaning: 'A critical electrolyte that helps heart muscles contract properly and nerves carry signals.',
      common_reasons_low: ['Fluid loss from vomiting or diarrhea', 'Certain diuretic blood pressure medications', 'Low dietary intake'],
      common_reasons_high: ['Kidneys excreting potassium at a slower rate', 'Certain blood pressure medications (e.g. ACE inhibitors, ARBs)', 'Laboratory sample cell breakdown'],
      questions_for_doctor: ['Is my potassium within the safe range for healthy heart rhythm?', 'Do any of my medications influence potassium levels?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Serum Potassium (గుండె లయ పొటాషియం)',
      plain_meaning: 'గుండె కండరాలు సక్రమంగా కొట్టుకోవడానికి మరియు నరాల పనితీరుకు అవసరమైన కీలక లవణం.',
      common_reasons_low: ['వాంతులు లేదా విరేచనాల వల్ల ద్రవాలు పోవడం', 'కొన్ని బీపీ మందుల వాడకం', 'ఆహార లోపం'],
      common_reasons_high: ['కిడ్నీలు పొటాషియంను నెమ్మదిగా విసర్జించడం', 'కొన్ని గుండె లేదా బీపీ మందుల ప్రభావం', 'రక్త నమూనాలో మార్పులు'],
      questions_for_doctor: ['గుండె స్పందనలకు ఈ పొటాషియం స్థాయి సురక్షితమేనా?', 'నా బీపీ మందులతో దీనికి సంబంధం ఉందా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Serum Potassium (पोटेशियम)',
      plain_meaning: 'हृदय की धड़कन को सामान्य रखने और मांसपेशियों के खिंचाव के लिए जरूरी इलेक्ट्रोलाइट।',
      common_reasons_low: ['उल्टी या दस्त से तरल पदार्थ की कमी', 'कुछ बीपी की दवाएं', 'आहार में कमी'],
      common_reasons_high: ['किडनी द्वारा पोटेशियम कम निकलना', 'कुछ रक्तचाप की दवाओं का असर', 'लैब सैंपल का प्रभाव'],
      questions_for_doctor: ['क्या यह स्तर दिल की धड़कन के लिए सुरक्षित है?', 'क्या मेरी दवाओं का इस पर प्रभाव है?'],
      language_reviewed: false
    }
  },
  {
    id: 'chloride',
    area: 'electrolytes',
    aliases: ['serum chloride', 'chloride', 'cl-'],
    en: {
      display_name: 'Serum Chloride',
      plain_meaning: 'An electrolyte working alongside sodium to maintain proper fluid volume and acid-base balance.',
      common_reasons_low: ['Severe prolonged vomiting', 'Overhydration', 'Diuretic therapy'],
      common_reasons_high: ['Dehydration', 'Kidney excretion changes', 'High dietary salt'],
      questions_for_doctor: ['Does my chloride align with my sodium and bicarbonate readings?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Serum Chloride (క్లోరైడ్ లవణం)',
      plain_meaning: 'శరీరంలో నీటి పరిమాణాన్ని మరియు ఆమ్ల-క్షార సమతుల్యతను కాపాడే లవణం.',
      common_reasons_low: ['వాంతులు కావడం', 'ఎక్కువ నీరు తాగడం'],
      common_reasons_high: ['శరీరంలో నీరు తగ్గడం (డీహైడ్రేషన్)', 'ఎక్కువ ఉప్పు తినడం'],
      questions_for_doctor: ['సోడియం మరియు ఇతర లవణాలతో ఇది ఎలా సరిపోలుతుంది?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Serum Chloride (क्लोराइड)',
      plain_meaning: 'सोडियम के साथ मिलकर शरीर में तरल पदार्थ और एसिड का संतुलन रखने वाला तत्व।',
      common_reasons_low: ['लगातार उल्टी होना', 'अत्यधिक पानी पीना'],
      common_reasons_high: ['पानी की कमी (डिहाइड्रेशन)', 'अधिक नमक का सेवन'],
      questions_for_doctor: ['क्या यह सोडियम और अन्य तत्वों से मेल खाता है?'],
      language_reviewed: false
    }
  },

  // =========================================================================
  // 9. URINALYSIS & URINE PANEL (9 Tests)
  // =========================================================================
  {
    id: 'urine_specific_gravity',
    area: 'urine',
    aliases: ['specific gravity', 'urine specific gravity', 'sp. gravity'],
    en: {
      display_name: 'Urine Specific Gravity',
      plain_meaning: 'Measures how concentrated or diluted your urine is, reflecting how well your kidneys balance water.',
      common_reasons_low: ['High fluid and water intake (very dilute urine)', 'Kidneys excreting extra water'],
      common_reasons_high: ['Dehydration (concentrated urine)', 'Fluid loss from sweating or fever'],
      questions_for_doctor: ['Does this indicate I should drink more water?', 'Is my kidney concentrating ability healthy?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Specific Gravity (మూత్రం చిక్కదనం)',
      plain_meaning: 'మూత్రం ఎంత చిక్కగా లేదా పల్చగా ఉందో కొలిచే పరీక్ష; కిడ్నీల నీటి నిర్వహణను చూపుతుంది.',
      common_reasons_low: ['ఎక్కువ నీరు తాగడం వల్ల మూత్రం పల్చబడటం'],
      common_reasons_high: ['నీరు తక్కువగా తాగడం వల్ల మూత్రం చిక్కబడటం', 'చెమట లేదా జ్వరం వల్ల ద్రవాలు తగ్గడం'],
      questions_for_doctor: ['నేను ఎక్కువ నీరు తాగాల్సిన అవసరం ఉందా?', 'నా మూత్రపిండాల పనితీరు బాగుందా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Specific Gravity (पेशाब का गाढ़ापन)',
      plain_meaning: 'यह मापता है कि पेशाब कितना गाढ़ा या पतला है, जिससे पानी के संतुलन का पता चलता है।',
      common_reasons_low: ['ज्यादा पानी पीने से पेशाब का पतला होना'],
      common_reasons_high: ['पानी कम पीने से पेशाब गाढ़ा होना', 'पसीने या बुखार से तरल की कमी'],
      questions_for_doctor: ['क्या मुझे अधिक पानी पीने की जरूरत है?', 'क्या गुर्दे पानी का संतुलन सही रख रहे हैं?'],
      language_reviewed: false
    }
  },
  {
    id: 'urine_ph',
    area: 'urine',
    aliases: ['ph', 'urine ph'],
    en: {
      display_name: 'Urine pH',
      plain_meaning: 'Measures the acidity or alkalinity of your urine, influenced by diet and metabolism.',
      common_reasons_low: ['High protein or meat intake (acidic urine)', 'Dehydration', 'Diabetic ketoacidosis'],
      common_reasons_high: ['Vegetarian diet (alkaline urine)', 'Certain urinary bacterial infections', 'Vomiting'],
      questions_for_doctor: ['Does my urine pH influence kidney stone risk?', 'Does my diet explain this reading?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Urine pH (మూత్రం ఆమ్లత / pH)',
      plain_meaning: 'మూత్రం ఆమ్లంగా ఉందా లేక క్షారంగా ఉందా అని కొలిచే సూచిక; ఆహారం దీనిని ప్రభావితం చేస్తుంది.',
      common_reasons_low: ['మాంసాహారం ఎక్కువ తినడం', 'డీహైడ్రేషన్'],
      common_reasons_high: ['శాకాహారం ఎక్కువగా తీసుకోవడం', 'యూరినరీ ఇన్ఫెక్షన్'],
      questions_for_doctor: ['ఈ pH వల్ల కిడ్నీలో రాళ్ళు వచ్చే అవకాశం ఉందా?', 'ఆహారంతో దీనికి సంబంధం ఉందా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Urine pH (पेशाब का एसिडिक स्तर / pH)',
      plain_meaning: 'पेशाब में एसिड या क्षार की मात्रा दर्शाता है, जो आहार और पाचन पर निर्भर करता है।',
      common_reasons_low: ['मांसाहारी भोजन', 'पानी की कमी'],
      common_reasons_high: ['शाकाहारी भोजन', 'पेशाब में इन्फेक्शन'],
      questions_for_doctor: ['क्या इस pH से पथरी (स्टोन) का खतरा है?', 'क्या खान-पान से यह जुड़ा है?'],
      language_reviewed: false
    }
  },
  {
    id: 'urine_protein',
    area: 'urine',
    aliases: ['protein', 'urine protein', 'albumin urine', 'urine albumin'],
    en: {
      display_name: 'Urine Protein',
      plain_meaning: 'Checks whether protein is leaking across the kidney filtration barrier into urine.',
      common_reasons_low: ['Negative is the normal, desired physiological finding'],
      common_reasons_high: ['Strenuous exercise or high fever prior to testing', 'Temporary dehydration', 'Kidney filtration barrier irritation'],
      questions_for_doctor: ['Is this protein spill temporary or persistent?', 'Should we verify with an early morning sample or repeat check?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Urine Protein (మూత్రంలో ప్రోటీన్)',
      plain_meaning: 'మూత్రపిండాల వడపోత నుండి ప్రోటీన్ ఏమైనా మూత్రంలోకి లీక్ అవుతుందా అని చూసే పరీక్ష.',
      common_reasons_low: ['నెగెటివ్ (Negative) గా ఉండటమే ఆరోగ్యకరమైన సాధారణ స్థితి'],
      common_reasons_high: ['తీవ్రమైన వ్యాయామం లేదా అధిక జ్వరం', 'డీహైడ్రేషన్', 'కిడ్నీ వడపోతలో చిన్న మార్పులు'],
      questions_for_doctor: ['మూత్రంలో ప్రోటీన్ రావడం తాత్కాలికమేనా?', 'ఉదయం మొదటి మూత్రంతో మళ్ళీ పరీక్షించాలా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Urine Protein (पेशाब में प्रोटीन)',
      plain_meaning: 'यह जांचता है कि क्या गुर्दों की छलनियों से प्रोटीन पेशाब में रिस रहा है।',
      common_reasons_low: ['नेगेटिव (Negative) होना पूरी तरह सामान्य और स्वस्थ है'],
      common_reasons_high: ['जांच से पहले तेज दौड़ या भारी व्यायाम', 'तेज बुखार या पानी की कमी', 'गुर्दों के फिल्टर पर दबाव'],
      questions_for_doctor: ['क्या पेशाब में प्रोटीन का आना अस्थायी है?', 'क्या सुबह के पहले पेशाब से दोबारा जांच करानी चाहिए?'],
      language_reviewed: false
    }
  },
  {
    id: 'urine_glucose',
    area: 'urine',
    aliases: ['glucose', 'urine glucose', 'sugar urine'],
    en: {
      display_name: 'Urine Glucose',
      plain_meaning: 'Checks whether blood sugar levels are high enough to spill over into the urine.',
      common_reasons_low: ['Negative is the expected normal finding'],
      common_reasons_high: ['Elevated blood glucose exceeding the kidney threshold', 'Pregnancy lowering the glucose threshold', 'Certain diabetes medications (SGLT2 inhibitors)'],
      questions_for_doctor: ['Does this correlate with blood sugar readings?', 'Could any of my medications cause glucose in urine?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Urine Glucose (మూత్రంలో చక్కెర)',
      plain_meaning: 'రక్తంలో చక్కెర స్థాయిలు ఎక్కువగా ఉండి మూత్రంలోకి పొంగి వస్తున్నాయా అని చూస్తుంది.',
      common_reasons_low: ['నెగెటివ్ ఉండటమే సహజమైన సాధారణ స్థితి'],
      common_reasons_high: ['రక్తంలో చక్కెర చాలా ఎక్కువగా ఉండటం', 'గర్భధారణ', 'కొన్ని షుగర్ మందుల ప్రభావం'],
      questions_for_doctor: ['రక్తంలో చక్కెరతో దీనికి సంబంధం ఉందా?', 'నా మందుల వల్ల మూత్రంలో చక్కెర వస్తుందా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Urine Glucose (पेशाब में ग्लूकोज/शुगर)',
      plain_meaning: 'यह देखता है कि क्या रक्त में शुगर इतनी बढ़ गई है कि वह पेशाब में रिसने लगी है।',
      common_reasons_low: ['नेगेटिव होना स्वाभाविक और सामान्य है'],
      common_reasons_high: ['ब्लड शुगर का बहुत अधिक होना', 'गर्भावस्था', 'डायबिटीज की कुछ दवाओं का असर'],
      questions_for_doctor: ['क्या यह ब्लड शुगर टेस्ट से मेल खाता है?', 'क्या मेरी दवाओं के कारण पेशाब में शुगर है?'],
      language_reviewed: false
    }
  },
  {
    id: 'urine_ketones',
    area: 'urine',
    aliases: ['ketones', 'urine ketones', 'ketone bodies'],
    en: {
      display_name: 'Urine Ketones',
      plain_meaning: 'Substances produced when your body burns fat instead of carbohydrates for fuel.',
      common_reasons_low: ['Negative is the normal expected result'],
      common_reasons_high: ['Prolonged fasting or low-carb diets', 'Vomiting or poor food intake during illness', 'Insulin deficiency in diabetes'],
      questions_for_doctor: ['Could fasting or illness explain this ketone finding?', 'Should blood sugar be checked alongside ketones?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Urine Ketones (కీటోన్స్)',
      plain_meaning: 'శరీరం చక్కెరలకు బదులుగా కొవ్వులను కరిగించి శక్తిని పొందినప్పుడు తయారయ్యే పదార్థాలు.',
      common_reasons_low: ['నెగెటివ్ ఉండటం సాధారణం'],
      common_reasons_high: ['ఎక్కువ సమయం భోజనం చేయకపోవడం లేదా ఉపవాసం', 'అనారోగ్యం వల్ల ఆహారం తీసుకోకపోవడం', 'డయాబెటిస్‌లో ఇన్సులిన్ లోపం'],
      questions_for_doctor: ['ఉపవాసం వల్ల కీటోన్లు వచ్చాయా?', 'రక్తంలో చక్కెరను కూడా పరీక్షించాలా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Urine Ketones (कीटोन्स)',
      plain_meaning: 'जब शरीर ग्लूकोज की जगह फैट (वसा) को जलाकर ऊर्जा बनाता है, तब बनने वाले तत्व।',
      common_reasons_low: ['नेगेटिव होना सामान्य है'],
      common_reasons_high: ['लंबे समय तक उपवास या भूखे रहना', 'बीमारी में खाना न पचना', 'डायबिटीज में इंसुलिन की कमी'],
      questions_for_doctor: ['क्या उपवास से यह रीडिंग आई है?', 'क्या तुरंत ब्लड शुगर जांचना चाहिए?'],
      language_reviewed: false
    }
  },
  {
    id: 'urine_nitrite',
    area: 'urine',
    aliases: ['nitrite', 'urine nitrite'],
    en: {
      display_name: 'Urine Nitrite',
      plain_meaning: 'Detects chemical byproducts produced by certain bacteria in the urinary tract.',
      common_reasons_low: ['Negative is the normal healthy result'],
      common_reasons_high: ['Presence of nitrate-converting bacteria in the bladder or urinary tract'],
      questions_for_doctor: ['Does this point to a urinary tract infection (UTI)?', 'Should a urine culture test be conducted?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Urine Nitrite (యూరిన్ నైట్రైట్)',
      plain_meaning: 'మూత్రనాళంలో కొన్ని రకాల బాక్టీరియా విడుదల చేసే రసాయనాలను గుర్తించే పరీక్ష.',
      common_reasons_low: ['నెగెటివ్ ఉండటం సాధారణ ఆరోగ్య సూచిక'],
      common_reasons_high: ['మూత్రనాళంలో బాక్టీరియా ఇన్ఫెక్షన్ ఉండటం (UTI)'],
      questions_for_doctor: ['నాకు యూరినరీ ఇన్ఫెక్షన్ ఉందా?', 'యూరిన్ కల్చర్ పరీక్ష చేయించాలా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Urine Nitrite (नाइट्राइट)',
      plain_meaning: 'पेशाब की नली में कुछ बैक्टीरिया द्वारा बनाए गए रसायनों की पहचान करता है।',
      common_reasons_low: ['नेगेटिव होना सामान्य और स्वस्थ है'],
      common_reasons_high: ['पेशाब की नली या मूत्राशय में बैक्टीरिया इन्फेक्शन (UTI)'],
      questions_for_doctor: ['क्या यह यूरिन इन्फेक्शन का संकेत है?', 'क्या यूरिन कल्चर टेस्ट कराना चाहिए?'],
      language_reviewed: false
    }
  },
  {
    id: 'urine_leukocyte_esterase',
    area: 'urine',
    aliases: ['leukocyte esterase', 'wbc esterase', 'leukocytes (dipstick)'],
    en: {
      display_name: 'Urine Leukocyte Esterase',
      plain_meaning: 'An enzyme released by white blood cells that indicates inflammation or infection in the urinary tract.',
      common_reasons_low: ['Negative is normal'],
      common_reasons_high: ['Urinary tract inflammation or infection', 'Contamination from nearby genital skin'],
      questions_for_doctor: ['Could this indicate bladder or urinary inflammation?', 'Does this warrant a urine culture check?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Leukocyte Esterase (మూత్రంలో తెల్ల కణాల ఎంజైమ్)',
      plain_meaning: 'మూత్రనాళంలో ఇన్ఫెక్షన్ లేదా వాపు ఉన్నప్పుడు తెల్ల రక్త కణాలు విడుదల చేసే ఎంజైమ్.',
      common_reasons_low: ['నెగెటివ్ ఉండటం సాధారణం'],
      common_reasons_high: ['మూత్రనాళంలో ఇన్ఫెక్షన్ లేదా చికాకు', 'నమూనా కలుషితం కావడం'],
      questions_for_doctor: ['మూత్రంలో మంట లేదా ఇన్ఫెక్షన్ ఉందా?', 'కల్చర్ పరీక్ష అవసరమా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Leukocyte Esterase (श्वेत कोशिका एंजाइम)',
      plain_meaning: 'पेशाब में श्वेत रक्त कोशिकाओं (WBC) से निकलने वाला एंजाइम जो सूजन या इन्फेक्शन दर्शाता है।',
      common_reasons_low: ['नेगेटिव होना सामान्य है'],
      common_reasons_high: ['पेशाब में सूजन या बैक्टीरिया संक्रमण', 'सैंपल में बाहरी त्वचा का संपर्क'],
      questions_for_doctor: ['क्या यह यूरिन इन्फेक्शन का संकेत है?', 'क्या मुझे कल्चर टेस्ट कराना चाहिए?'],
      language_reviewed: false
    }
  },
  {
    id: 'urine_microscopic_wbc',
    area: 'urine',
    aliases: ['microscopic wbc', 'pus cells', 'wbc (microscopic)', 'wbcs / hpf', 'pus cells / hpf'],
    en: {
      display_name: 'Microscopic WBC (Pus Cells)',
      plain_meaning: 'The actual count of white blood cells visible under a microscope per high-power field.',
      common_reasons_low: ['0 to 5 /HPF is the expected healthy physiological range'],
      common_reasons_high: ['Urinary tract infection', 'Kidney or bladder inflammation', 'Genital skin contamination during sample collection'],
      questions_for_doctor: ['Do my pus cells indicate a urinary infection?', 'Should we verify with a clean-catch midstream urine sample?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Microscopic WBC (పస్ సెల్స్ / చీము కణాలు)',
      plain_meaning: 'మైక్రోస్కోప్ కింద మూత్రంలో కనిపించే రక్షణ తెల్ల రక్త కణాల సంఖ్య.',
      common_reasons_low: ['0 నుండి 5 వరకు ఉండటం సహజమైన సాధారణ పరిధి'],
      common_reasons_high: ['యూరినరీ ట్రాక్ట్ ఇన్ఫెక్షన్ (మూత్రంలో ఇన్ఫెక్షన్)', 'మూత్రకోశంలో వాపు', 'నమూనా సేకరణ సమయంలో చర్మం తగలడం'],
      questions_for_doctor: ['ఈ పస్ సెల్స్ ఇన్ఫెక్షన్‌ను సూచిస్తున్నాయా?', 'మళ్ళీ శుభ్రమైన మూత్ర నమూనాతో పరీక్షించాలా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Microscopic WBC (पस कोशिकाएं / Pus Cells)',
      plain_meaning: 'माइक्रोस्कोप के नीचे पेशाब में देखी जाने वाली श्वेत रक्त कोशिकाओं की संख्या।',
      common_reasons_low: ['0 से 5 तक होना स्वाभाविक और सामान्य है'],
      common_reasons_high: ['यूरिन इन्फेक्शन', 'मूत्राशय में सूजन', 'सैंपल लेते समय अशुद्धता'],
      questions_for_doctor: ['क्या यह पेशाब में इन्फेक्शन का पक्का संकेत है?', 'क्या साफ तरीके से दोबारा सैंपल देना चाहिए?'],
      language_reviewed: false
    }
  },
  {
    id: 'urine_microscopic_rbc',
    area: 'urine',
    aliases: ['microscopic rbc', 'rbc (microscopic)', 'rbcs / hpf', 'red blood cells (microscopic)'],
    en: {
      display_name: 'Microscopic RBC',
      plain_meaning: 'The count of red blood cells visible in urine under high-power magnification.',
      common_reasons_low: ['0 to 2 /HPF is normal physiological range'],
      common_reasons_high: ['Strenuous exercise prior to sample', 'Kidney stone transit or urinary tract irritation', 'Menstrual contamination during collection'],
      questions_for_doctor: ['Could intense exercise or collection timing explain this?', 'Do I need kidney or bladder ultrasound imaging?'],
      language_reviewed: true
    },
    te: {
      display_name: 'Microscopic RBC (మూత్రంలో ఎర్ర కణాలు)',
      plain_meaning: 'మైక్రోస్కోప్ కింద మూత్రంలో కనిపించే ఎర్ర రక్త కణాల సంఖ్య.',
      common_reasons_low: ['0 నుండి 2 వరకు ఉండటం సాధారణం'],
      common_reasons_high: ['పరీక్షకు ముందు తీవ్ర వ్యాయామం చేయడం', 'కిడ్నీలో రాళ్ళు లేదా మూత్రనాళంలో చికాకు', 'రుతుస్రావం సమయం'],
      questions_for_doctor: ['కసరత్తు చేయడం వల్ల ఎర్ర కణాలు కనిపించాయా?', 'కిడ్నీ స్కానింగ్ అవసరమా?'],
      language_reviewed: false
    },
    hi: {
      display_name: 'Microscopic RBC (पेशाब में लाल रक्त कोशिकाएं)',
      plain_meaning: 'माइक्रोस्कोप से देखने पर पेशाब में मिलने वाली लाल रक्त कोशिकाओं की संख्या।',
      common_reasons_low: ['0 से 2 तक होना सामान्य है'],
      common_reasons_high: ['भारी व्यायाम', 'गुर्दे में पथरी या नली में खिंचाव', 'मासिक धर्म के दौरान सैंपल देना'],
      questions_for_doctor: ['क्या व्यायाम या समय की वजह से यह रीडिंग आई?', 'क्या किडनी का अल्ट्रासाउंड जरूरी है?'],
      language_reviewed: false
    }
  }
];

/**
 * Normalizes test name string for alias matching
 */
function normalizeKey(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finds matching test in the knowledge base by alias or name
 * @param {string} testName
 * @returns {Object|null} Knowledge base entry or null if unknown
 */
export function findTestKnowledge(testName) {
  if (!testName) return null;
  const target = normalizeKey(testName);

  for (const entry of MULTILINGUAL_TEST_KNOWLEDGE) {
    if (normalizeKey(entry.id) === target) return entry;
    for (const alias of entry.aliases) {
      const normAlias = normalizeKey(alias);
      if (normAlias === target || target.includes(normAlias) || normAlias.includes(target)) {
        return entry;
      }
    }
  }
  return null;
}
