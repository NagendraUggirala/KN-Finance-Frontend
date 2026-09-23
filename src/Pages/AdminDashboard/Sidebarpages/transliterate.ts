/**
 * Bidirectional English <-> Telugu transliteration engine
 * Supports automatic phonetic mapping and rich dictionary for Indian / Telugu names.
 */

// Check if string contains Telugu characters
export const isTeluguText = (text: string): boolean => {
  return /[\u0C00-\u0C7F]/.test(text);
};

// Check if string contains English / Latin characters
export const isEnglishText = (text: string): boolean => {
  return /[a-zA-Z]/.test(text);
};

// Common Telugu Names & Surnames Dictionary for 100% natural transliteration
const NAME_DICTIONARY: { [key: string]: { telugu: string; english: string } } = {
  // Common full names / parts
  krishnarao: { telugu: 'కృష్ణారావు', english: 'Krishna Rao' },
  krishna: { telugu: 'కృష్ణ', english: 'Krishna' },
  rao: { telugu: 'రావు', english: 'Rao' },
  satyanarayana: { telugu: 'సత్యనారాయణ', english: 'Satyanarayana' },
  padmavathi: { telugu: 'పద్మావతి', english: 'Padmavathi' },
  padmavati: { telugu: 'పద్మావతి', english: 'Padmavathi' },
  ramachandrudu: { telugu: 'రామచంద్రుడు', english: 'Ramachandrudu' },
  ramachandra: { telugu: 'రామచంద్ర', english: 'Ramachandra' },
  venkataramana: { telugu: 'వెంకటరమణ', english: 'Venkataramana' },
  venkatesh: { telugu: 'వెంకటేష్', english: 'Venkatesh' },
  venkateswarlu: { telugu: 'వెంకటేశ్వర్లు', english: 'Venkateswarlu' },
  venkat: { telugu: 'వెంకట్', english: 'Venkat' },
  ramesh: { telugu: 'రమేష్', english: 'Ramesh' },
  suresh: { telugu: 'సురేష్', english: 'Suresh' },
  naresh: { telugu: 'నరేష్', english: 'Naresh' },
  harish: { telugu: 'హరీష్', english: 'Harish' },
  rajesh: { telugu: 'రాజేష్', english: 'Rajesh' },
  anil: { telugu: 'అనిల్', english: 'Anil' },
  sunil: { telugu: 'సునీల్', english: 'Sunil' },
  pooja: { telugu: 'పూజ', english: 'Pooja' },
  puja: { telugu: 'పూజ', english: 'Pooja' },
  vikram: { telugu: 'విక్రమ్', english: 'Vikram' },
  karan: { telugu: 'కరణ్', english: 'Karan' },
  johar: { telugu: 'జోహార్', english: 'Johar' },
  sunita: { telugu: 'సునీత', english: 'Sunita' },
  suneetha: { telugu: 'సునీత', english: 'Sunita' },
  vijay: { telugu: 'విజయ్', english: 'Vijay' },
  ravi: { telugu: 'రవి', english: 'Ravi' },
  raju: { telugu: 'రాజు', english: 'Raju' },
  srinivas: { telugu: 'శ్రీనివాస్', english: 'Srinivas' },
  sreenivas: { telugu: 'శ్రీనివాస్', english: 'Srinivas' },
  srinivasulu: { telugu: 'శ్రీనివాసులు', english: 'Srinivasulu' },
  prasad: { telugu: 'ప్రసాద్', english: 'Prasad' },
  mahesh: { telugu: 'మహేష్', english: 'Mahesh' },
  sai: { telugu: 'సాయి', english: 'Sai' },
  shiva: { telugu: 'శివ', english: 'Shiva' },
  siva: { telugu: 'శివ', english: 'Shiva' },
  kumar: { telugu: 'కుమార్', english: 'Kumar' },
  reddy: { telugu: 'రెడ్డి', english: 'Reddy' },
  chowdary: { telugu: 'చౌదరి', english: 'Chowdary' },
  choudary: { telugu: 'చౌదరి', english: 'Chowdary' },
  sharma: { telugu: 'శర్మ', english: 'Sharma' },
  varma: { telugu: 'వర్మ', english: 'Varma' },
  naidu: { telugu: 'నాయుడు', english: 'Naidu' },
  gupta: { telugu: 'గుప్తా', english: 'Gupta' },
  patel: { telugu: 'పటేల్', english: 'Patel' },
  singh: { telugu: 'సింగ్', english: 'Singh' },
  devi: { telugu: 'దేవి', english: 'Devi' },
  rani: { telugu: 'రాణి', english: 'Rani' },
  goud: { telugu: 'గౌడ్', english: 'Goud' },
  yadav: { telugu: 'యాదవ్', english: 'Yadav' },
  lakshmi: { telugu: 'లక్ష్మి', english: 'Lakshmi' },
  laxmi: { telugu: 'లక్ష్మి', english: 'Lakshmi' },
  nagendra: { telugu: 'నాగేంద్ర', english: 'Nagendra' },
  narendra: { telugu: 'నరేంద్ర', english: 'Narendra' },
  mohan: { telugu: 'మోహన్', english: 'Mohan' },
  murali: { telugu: 'మురళి', english: 'Murali' },
  gopal: { telugu: 'గోపాల్', english: 'Gopal' },
  anitha: { telugu: 'అనిత', english: 'Anitha' },
  anita: { telugu: 'అనిత', english: 'Anitha' },
  swathi: { telugu: 'స్వాతి', english: 'Swathi' },
  swati: { telugu: 'స్వాతి', english: 'Swathi' },
  geetha: { telugu: 'గీత', english: 'Geetha' },
  geeta: { telugu: 'గీత', english: 'Geetha' },
  radha: { telugu: 'రాధ', english: 'Radha' },
  bhavani: { telugu: 'భవాని', english: 'Bhavani' },
  durga: { telugu: 'దుర్గ', english: 'Durga' },
  chandra: { telugu: 'చంద్ర', english: 'Chandra' },
  sekhar: { telugu: 'శేఖర్', english: 'Sekhar' },
  shekhar: { telugu: 'శేఖర్', english: 'Sekhar' },
  naveen: { telugu: 'నవీన్', english: 'Naveen' },
  praveen: { telugu: 'ప్రవీణ్', english: 'Praveen' },
  santosh: { telugu: 'సంతోష్', english: 'Santosh' },
  santhosh: { telugu: 'సంతోష్', english: 'Santosh' },
  madhu: { telugu: 'మధు', english: 'Madhu' },
  sindhu: { telugu: 'సింధు', english: 'Sindhu' },
  kavitha: { telugu: 'కవిత', english: 'Kavitha' },
  kavita: { telugu: 'కవిత', english: 'Kavitha' },
  sarada: { telugu: 'శారద', english: 'Sarada' },
  sharada: { telugu: 'శారద', english: 'Sarada' },
  balaji: { telugu: 'బాలాజీ', english: 'Balaji' },
  ganesh: { telugu: 'గణేష్', english: 'Ganesh' },
  manoj: { telugu: 'మనోజ్', english: 'Manoj' },
  tarun: { telugu: 'తరుణ్', english: 'Tarun' },
  tharun: { telugu: 'తరుణ్', english: 'Tarun' },
  kalyan: { telugu: 'కళ్యాణ్', english: 'Kalyan' },
  sagar: { telugu: 'సాగర్', english: 'Sagar' },
  pavan: { telugu: 'పవన్', english: 'Pavan' },
  pawan: { telugu: 'పవన్', english: 'Pavan' },
  karthik: { telugu: 'కార్తీక్', english: 'Karthik' },
  kartik: { telugu: 'కార్తీక్', english: 'Karthik' },
  vamsi: { telugu: 'వంశీ', english: 'Vamsi' },
  vamshi: { telugu: 'వంశీ', english: 'Vamsi' },
  anuradha: { telugu: 'అనూరాధ', english: 'Anuradha' },
  sandhya: { telugu: 'సంధ్య', english: 'Sandhya' },
  deepika: { telugu: 'దీపిక', english: 'Deepika' },
  divya: { telugu: 'దివ్య', english: 'Divya' },
  jyothi: { telugu: 'జ్యోతి', english: 'Jyothi' },
  jyoti: { telugu: 'జ్యోతి', english: 'Jyothi' },
  usha: { telugu: 'ఉష', english: 'Usha' },
  latha: { telugu: 'లత', english: 'Latha' },
  lata: { telugu: 'లత', english: 'Latha' },
  seetha: { telugu: 'సీత', english: 'Seetha' },
  sita: { telugu: 'సీత', english: 'Seetha' },
  subbarao: { telugu: 'సుబ్బారావు', english: 'Subba Rao' },
  apparao: { telugu: 'అప్పారావు', english: 'Appa Rao' },
  nageswara: { telugu: 'నాగేశ్వర', english: 'Nageswara' },
  narayana: { telugu: 'నారాయణ', english: 'Narayana' },
  raghava: { telugu: 'రాఘవ', english: 'Raghava' },
  govind: { telugu: 'గోవింద్', english: 'Govind' },
  jagadeesh: { telugu: 'జగదీష్', english: 'Jagadeesh' },
  sudhakar: { telugu: 'సుధాకర్', english: 'Sudhakar' },
  bhaskar: { telugu: 'భాస్కర్', english: 'Bhaskar' },
  somesh: { telugu: 'సోమేష్', english: 'Somesh' },
  lokesh: { telugu: 'లోకేష్', english: 'Lokesh' },
  dinesh: { telugu: 'దినేష్', english: 'Dinesh' },
  babu: { telugu: 'బాబు', english: 'Babu' },
  appanna: { telugu: 'అప్పన్న', english: 'Appanna' },
  simhachalam: { telugu: 'సింహాచలం', english: 'Simhachalam' },
  chiranjeevi: { telugu: 'చిరంజీవి', english: 'Chiranjeevi' },
  balakrishna: { telugu: 'బాలకృష్ణ', english: 'Balakrishna' },
  nagarjuna: { telugu: 'నాగార్జున', english: 'Nagarjuna' }
};

// Build inverse lookup for Telugu to English
const TELUGU_TO_ENGLISH_DICT: { [key: string]: string } = {};
Object.values(NAME_DICTIONARY).forEach(({ telugu, english }) => {
  TELUGU_TO_ENGLISH_DICT[telugu] = english;
});

// Phonetic Vowels for English to Telugu
const INDEPENDENT_VOWELS: { [key: string]: string } = {
  aa: 'ఆ',
  a: 'అ',
  ee: 'ఈ',
  ii: 'ఈ',
  i: 'ఇ',
  oo: 'ఊ',
  uu: 'ఊ',
  u: 'ఉ',
  ru: 'ఋ',
  ai: 'ఐ',
  ay: 'ఐ',
  au: 'ఔ',
  ou: 'ఔ',
  ea: 'ఏ',
  e: 'ఎ',
  oa: 'ఓ',
  o: 'ఒ'
};

const VOWEL_MATRAS: { [key: string]: string } = {
  aa: 'ా',
  a: '',
  ee: 'ీ',
  ii: 'ీ',
  i: 'ి',
  oo: 'ూ',
  uu: 'ూ',
  u: 'ు',
  ru: 'ృ',
  ai: 'ై',
  ay: 'ై',
  au: 'ౌ',
  ou: 'ౌ',
  e: 'ె',
  o: 'ొ'
};

const CONSONANTS_EN_TE: [string, string][] = [
  ['ksha', 'క్ష'],
  ['kshi', 'క్షి'],
  ['ksh', 'క్ష్'],
  ['shh', 'ష్'],
  ['sh', 'శ'],
  ['chh', 'ఛ'],
  ['ch', 'చ'],
  ['thh', 'థ'],
  ['th', 'త'],
  ['dhh', 'ఢ'],
  ['dh', 'ధ'],
  ['bhh', 'భ'],
  ['bh', 'భ'],
  ['gh', 'ఘ'],
  ['kh', 'ఖ'],
  ['ph', 'ఫ'],
  ['jh', 'ఝ'],
  ['ny', 'ఞ'],
  ['ng', 'ఙ'],
  ['gn', 'జ్ఞ'],
  ['jn', 'జ్ఞ'],
  ['gy', 'జ్ఞ'],
  ['ts', 'చ'],
  ['dz', 'జ'],
  ['k', 'క'],
  ['g', 'గ'],
  ['c', 'క'],
  ['j', 'జ'],
  ['t', 'త'],
  ['d', 'ద'],
  ['n', 'న'],
  ['p', 'ప'],
  ['f', 'ఫ'],
  ['b', 'బ'],
  ['m', 'మ'],
  ['y', 'య'],
  ['r', 'ర'],
  ['l', 'ల'],
  ['v', 'వ'],
  ['w', 'వ'],
  ['s', 'స'],
  ['h', 'హ'],
  ['z', 'జ'],
  ['x', 'క్స్']
];

// Single word phonetic English -> Telugu
function transliterateWordEnToTe(rawWord: string): string {
  const clean = rawWord.trim().toLowerCase();
  if (!clean) return '';

  if (NAME_DICTIONARY[clean]) {
    return NAME_DICTIONARY[clean].telugu;
  }

  let i = 0;
  let out = '';
  const len = clean.length;

  while (i < len) {
    // Check if start of word or after vowel/space for independent vowels
    const isStart = i === 0 || out.endsWith(' ') || out === '';

    if (isStart) {
      let matchedVowel = false;
      for (const [vStr, vTe] of Object.entries(INDEPENDENT_VOWELS)) {
        if (clean.substring(i).startsWith(vStr)) {
          out += vTe;
          i += vStr.length;
          matchedVowel = true;
          break;
        }
      }
      if (matchedVowel) continue;
    }

    // Check consonants
    let matchedConsonant = false;
    for (const [cStr, cTe] of CONSONANTS_EN_TE) {
      if (clean.substring(i).startsWith(cStr)) {
        i += cStr.length;

        // Lookahead for vowel matra
        let matchedMatra = false;
        for (const [vStr, vMatra] of Object.entries(VOWEL_MATRAS)) {
          if (clean.substring(i).startsWith(vStr)) {
            // If vStr is 'a'
            if (vStr === 'a') {
              // check if it's 'aa'
              if (clean.substring(i).startsWith('aa')) {
                out += cTe + 'ా';
                i += 2;
              } else {
                // Inherent 'a' -> consonant alone without virama
                out += cTe;
                i += 1;
              }
            } else {
              out += cTe + vMatra;
              i += vStr.length;
            }
            matchedMatra = true;
            break;
          }
        }

        if (!matchedMatra) {
          // No vowel follows -> add virama (్) if another consonant follows, or just consonant if end of word
          if (i < len && /[a-z]/.test(clean[i])) {
            out += cTe + '్';
          } else {
            out += cTe;
          }
        }

        matchedConsonant = true;
        break;
      }
    }

    if (!matchedConsonant) {
      // Non-matching character, copy as is
      out += clean[i];
      i++;
    }
  }

  return out;
}

/**
 * Transliterate English string to Telugu
 */
export function transliterateEnglishToTelugu(text: string): string {
  if (!text || !text.trim()) return '';

  // If already Telugu, return as is
  if (isTeluguText(text) && !isEnglishText(text)) return text;

  // Split into words while preserving spaces
  return text.split(/(\s+)/).map(part => {
    if (/^\s+$/.test(part)) return part;
    return transliterateWordEnToTe(part);
  }).join('');
}

// Telugu character map to English
const TELUGU_VOWELS: { [key: string]: string } = {
  'అ': 'a',
  'ఆ': 'aa',
  'ఇ': 'i',
  'ఈ': 'ee',
  'ఉ': 'u',
  'ఊ': 'oo',
  'ఋ': 'ru',
  'ౠ': 'roo',
  'ఎ': 'e',
  'ఏ': 'e',
  'ఐ': 'ai',
  'ఒ': 'o',
  'ఓ': 'o',
  'ఔ': 'au',
  'అం': 'am',
  'అః': 'aha'
};

const TELUGU_MATRAS: { [key: string]: string } = {
  '\u0C3E': 'aa', // ా
  '\u0C3F': 'i',  // ి
  '\u0C40': 'ee', // ీ
  '\u0C41': 'u',  // ు
  '\u0C42': 'oo', // ూ
  '\u0C43': 'ru', // ృ
  '\u0C44': 'roo',// ౄ
  '\u0C46': 'e',  // ె
  '\u0C47': 'e',  // ే
  '\u0C48': 'ai', // ై
  '\u0C4A': 'o',  // ొ
  '\u0C4B': 'o',  // ో
  '\u0C4C': 'au', // ౌ
  '\u0C02': 'm',  // ం (anusvara)
  '\u0C03': 'h'   // ః (visarga)
};

const TELUGU_CONSONANTS: { [key: string]: string } = {
  'క': 'k',
  'ఖ': 'kh',
  'గ': 'g',
  'ఘ': 'gh',
  'ఙ': 'ng',
  'చ': 'ch',
  'ఛ': 'chh',
  'జ': 'j',
  'ఝ': 'jh',
  'ఞ': 'ny',
  'ట': 't',
  'ఠ': 'th',
  'డ': 'd',
  'ఢ': 'dh',
  'ణ': 'n',
  'త': 't',
  'థ': 'th',
  'ద': 'd',
  'ధ': 'dh',
  'న': 'n',
  'ప': 'p',
  'ఫ': 'ph',
  'బ': 'b',
  'భ': 'bh',
  'మ': 'm',
  'య': 'y',
  'ర': 'r',
  'ల': 'l',
  'వ': 'v',
  'శ': 'sh',
  'ష': 'sh',
  'స': 's',
  'హ': 'h',
  'ళ': 'l',
  'క్ష': 'ksh',
  'ఱ': 'r',
  'జ్ఞ': 'gna'
};

// Single word Telugu -> English
function transliterateWordTeToEn(word: string): string {
  const clean = word.trim();
  if (!clean) return '';

  if (TELUGU_TO_ENGLISH_DICT[clean]) {
    return TELUGU_TO_ENGLISH_DICT[clean];
  }

  let out = '';
  let i = 0;
  const chars = Array.from(clean);
  const len = chars.length;

  while (i < len) {
    const ch = chars[i];
    const nextCh = i + 1 < len ? chars[i + 1] : '';
    const afterNextCh = i + 2 < len ? chars[i + 2] : '';

    // Check independent vowel
    if (TELUGU_VOWELS[ch]) {
      out += TELUGU_VOWELS[ch];
      i++;
      continue;
    }

    // Check consonant
    if (TELUGU_CONSONANTS[ch]) {
      const baseConsonant = TELUGU_CONSONANTS[ch];

      if (nextCh === '\u0C4D') {
        // Virama (halant ్)
        out += baseConsonant;
        i += 2; // skip consonant and virama
      } else if (TELUGU_MATRAS[nextCh]) {
        // Has matra
        out += baseConsonant + TELUGU_MATRAS[nextCh];
        i += 2;
      } else {
        // Inherent 'a'
        // If at the end of word and word is longer than 2 chars, or followed by anusvara
        if (nextCh === '\u0C02') {
          out += baseConsonant + 'am';
          i += 2;
        } else if (i === len - 1 && out.length > 2 && (ch === 'ల్' || ch === 'ర్' || ch === 'న్' || ch === 'మ్' || ch === 'వ్')) {
          out += baseConsonant;
          i++;
        } else {
          out += baseConsonant + 'a';
          i++;
        }
      }
      continue;
    }

    // Matra on its own or other symbols
    if (TELUGU_MATRAS[ch]) {
      out += TELUGU_MATRAS[ch];
      i++;
      continue;
    }

    out += ch;
    i++;
  }

  // Capitalize word
  if (out.length > 0) {
    return out.charAt(0).toUpperCase() + out.slice(1);
  }
  return out;
}

/**
 * Transliterate Telugu string to English
 */
export function transliterateTeluguToEnglish(text: string): string {
  if (!text || !text.trim()) return '';

  // If already pure English, format and return
  if (isEnglishText(text) && !isTeluguText(text)) {
    return text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  return text.split(/(\s+)/).map(part => {
    if (/^\s+$/.test(part)) return part;
    return transliterateWordTeToEn(part);
  }).join('');
}
