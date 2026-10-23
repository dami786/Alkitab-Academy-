export const defaultSettings = {
  registrationOpen: true,
  announcement: "",
  maxAge: 25,
  feeAmount: 0,
  feeNote:
    "Transfer the registration fee through EasyPaisa, JazzCash, or the Meezan Bank account, then submit the transaction ID and payment receipt. Your roll number is issued when the academy accepts your registration.",
  payment: {
    easypaisaName: "Khizar Hayyat Abbasi",
    easypaisaNumber: "+92313-5671167",
    jazzCashName: "Khizar Hayyat Abbasi",
    jazzCashNumber: "+92313-5671167",
    bankName: "Meezan Bank",
    accountTitle: "Khizar Hayyat Abbasi",
    accountNumber: "15 81 011 090 3850",
    iban: "",
  },
  contact: {
    phone: "03135671167",
    whatsapp: "03135671167",
    email: "alkitabquranacademy279@gmail.com",
    address: "Abbottabad, Pakistan",
    hours: "Monday – Saturday | 9:00 AM – 5:00 PM",
  },
  exam: {
    date: "To be announced",
    time: "To be announced",
    instructions: [
      "Bring your printed or digital admit card and original CNIC or B-Form.",
      "Reach the center at least 30 minutes before the reporting time.",
      "Mobile phones and books are not allowed inside the examination hall.",
      "Follow the instructions of the center staff. Unfair means will lead to disqualification.",
    ],
  },
  prizes: [
    { place: "1st", title: "1st National Position", amount: "PKR 300,000", detail: "Cash Prize & Shield" },
    { place: "2nd", title: "2nd National Position", amount: "PKR 200,000", detail: "Cash Prize & Shield" },
    { place: "3rd", title: "3rd National Position", amount: "PKR 100,000", detail: "Cash Prize & Shield" },
  ],
  top100:
    "Special prizes and certificates will be awarded to the top 20 position holders in recognition of their knowledge, dedication, and achievement.",
  timeline: [
    { title: "Registrations Open", date: "Session 2026–27" },
    { title: "Application Review", date: "After the form is submitted" },
    { title: "Roll Number & Admit Card", date: "Issued when the application is accepted" },
    { title: "Final Quiz Competition", date: "Date will be announced" },
  ],
  books: [
    {
      title: "الرحیق المختوم",
      author: "مولانا صفی الرحمن مبارک پوری رحمہ اللہ",
      english: "Ar-Raheeq Al-Makhtum — Maulana Safi-ur-Rahman Mubarakpuri",
      link: "https://drive.google.com/drive/folders/1evLRpy3xQDYZxCwjFvTF8mkyKz2TZboo",
      image: "/syllabus-books.jpg",
    },
    {
      title: "آسان سیرت محمد ﷺ",
      author: "مفتی مصطفیٰ عزیز",
      english: "Aasan Seerat Muhammad ﷺ — Mufti Mustafa Aziz",
      link: "https://drive.google.com/drive/folders/1evLRpy3xQDYZxCwjFvTF8mkyKz2TZboo",
      image: "/syllabus-notice.png",
    },
  ],
  centers: [
    ["Khyber Pakhtunkhwa", "Abbottabad & Mansehra"],
    ["Khyber Pakhtunkhwa", "Haripur & Wah Cantt"],
    ["Khyber Pakhtunkhwa", "Malakand"],
    ["Khyber Pakhtunkhwa", "Peshawar"],
    ["Punjab", "Rawalpindi & Islamabad"],
    ["Punjab", "Multan & Bahawalpur"],
    ["Punjab", "Sargodha & Khushab"],
    ["Punjab", "Faisalabad"],
    ["Punjab", "Gujranwala"],
    ["Punjab", "Lahore"],
    ["Punjab", "Rahim Yar Khan"],
    ["Sindh", "Hyderabad"],
    ["Sindh", "Karachi"],
    ["Balochistan", "Quetta"],
  ].map(([province, city]) => ({ province, city, venue: "", confirmed: false, examDate: "", examTime: "" })),
  hero: {
    badge: "A programme by Al-Kitab International Academy",
    title: "Rahmat-e-Kainat ﷺ Quiz Competition 2026–27",
    urduTitle: "الکتاب انٹرنیشنل آکیڈمی کے زیر نگرانی سیرت کوئز مقابلہ",
    tagline: "سیرتِ مصطفیٰ ﷺ، علم بھی، عمل بھی، کامیابی بھی",
    intro:
      "Our purpose is to help young people learn more about the life of Prophet Muhammad ﷺ through an engaging Seerah Quiz Competition. We aim to encourage the study of his teachings, build a stronger connection with his noble example, and inspire people to follow his guidance in their daily lives.",
  },
  about: {
    purpose:
      "Through this initiative, we hope to spread awareness of the Seerah among students, families, and communities. The blessed Seerah is not only knowledge to be read, but a way of life to be understood and lived.",
    urduIntro:
      "نبی کریم حضرت محمد مصطفیٰ ﷺ کی سیرتِ طیبہ ہمارے لیے زندگی گزارنے کا بہترین نمونہ ہے۔ آئیے! آپ ﷺ کی مبارک زندگی کو پڑھیں، سمجھیں اور اپنی زندگی میں اپنانے کی کوشش کریں۔ ہمارا مقصد امت مسلمہ کے نوجوان بچوں اور بچیوں کو سیرت نبوی سے آگاہ کرنا ہے، تاکہ ہماری آنے والی نسل کو سیرتِ مصطفیٰ ﷺ کا علم حاصل ہو، آپ ﷺ کی تعلیمات کو سمجھے اور اپنے کردار و زندگی کو سنتِ نبوی ﷺ کے مطابق بنانے کی کوشش کرے۔",
    mission:
      "We aim to make the study of the Seerah of Prophet Muhammad ﷺ meaningful and engaging for young learners. Through this competition, we seek to inspire students to learn about his life, understand his teachings, and bring his beautiful example into their everyday actions. We also hope to share the lessons of the Seerah with people from all backgrounds and encourage a positive change in society.",
    vision:
      "Our vision is to develop a generation that understands the life and character of Prophet Muhammad ﷺ, learns from his noble teachings, and reflects his values in daily life. We hope to encourage individuals and communities to build their lives on the principles of kindness, honesty, justice, respect, and compassion taught by the Prophet ﷺ.",
    objectives: [
      "To create greater interest among students in learning about the life, character, and teachings of Prophet Muhammad ﷺ.",
      "To provide a meaningful platform where participants can demonstrate their knowledge, improve their understanding, and develop a spirit of healthy competition.",
      "To inspire young people to follow the teachings of the Prophet ﷺ in their personal conduct and relationships with others.",
      "To encourage the spread of Islamic values, good character, and positive social behaviour through the study of Seerah.",
      "To connect learning with practice so that the lessons gained from the Seerah can become part of everyday life.",
    ],
    founderTitle: "Founder & Project Director",
    founderOrg: "Al-Kitab International Academy",
    founder:
      "Alhamdulillah, Al-Kitab International Academy organizes educational and Islamic competitions every year, providing children, teenagers, and students from diverse educational backgrounds with opportunities to participate and showcase their knowledge and abilities. Our goal goes beyond organizing competitions. We strive to develop a deeper connection between people and Islam, particularly by introducing the younger generation to the blessed Seerah of Prophet Muhammad ﷺ and inspiring them to follow his teachings in their daily lives.",
    highlightsTitle: "Under the Guidance of Esteemed Scholars",
    highlights:
      "Alhamdulillah, this noble educational initiative is being launched under the guidance and supervision of distinguished Muftis, renowned Islamic scholars, and respected teachers and mentors from Abbottabad. Our mission is to raise awareness of the Seerah of Prophet Muhammad ﷺ among the younger generation and inspire them to learn about his blessed life and teachings. We pray that Allah Almighty accepts this humble effort and grants it success. Ameen.",
  },
  syllabus: {
    urdu:
      "رحمتِ کائنات ﷺ کوئز کمپیٹیشن 2026–27 کا نصاب صرف دو کتابوں پر مشتمل ہے۔ پہلی کتاب الرحیق المختوم ہے، جس کے مصنف مولانا صفی الرحمن مبارک پوری رحمہ اللہ ہیں، اور دوسری کتاب آسان سیرت محمد ﷺ ہے، جس کے مصنف مفتی مصطفیٰ عزیز ہیں۔ اہم وضاحت: سیرت کے نصاب میں صرف یہی دو کتابیں شامل ہیں۔ ان کے علاوہ کوئی تیسری کتاب نصاب کا حصہ نہیں ہے۔ لہٰذا ان دونوں کتب کے مطابق اپنی تیاری مکمل کریں۔",
    english:
      "The Rahmat-e-Kainat ﷺ Quiz Competition 2026–27 syllabus contains only two books: Ar-Raheeq Al-Makhtum by Maulana Safi-ur-Rahman Mubarakpuri, and Aasan Seerat Muhammad ﷺ by Mufti Mustafa Aziz. No third book is part of the syllabus. Prepare completely from these two books.",
  },
  rewardsNote:
    "These prizes are an encouragement. The real success is to read the Seerah of the Messenger of Allah ﷺ, understand it, and try to live by it. Register today and begin this blessed journey.",
  eligibility: [
    {
      title: "Age Requirement",
      text: "Applicants must be 25 years of age or younger on the date of registration. Age is checked from the date of birth.",
    },
    {
      title: "Who May Apply",
      text: "Male and female students may both apply. Students of schools, colleges, and madaris are welcome.",
    },
    {
      title: "Educational Qualification",
      text: "Applicants with up to 16 years of education (Bachelor’s degree or equivalent) are eligible. Candidates holding postgraduate qualifications are not eligible.",
    },
    {
      title: "Identity Verification",
      text: "A valid CNIC or B-Form number is required. Applicant details are checked to identify duplicate entries.",
    },
    {
      title: "Photograph",
      text: "Male applicants must upload a clear, recent, passport-size photograph. Female applicants may upload a photograph if they wish. PNG is preferred.",
    },
    {
      title: "One Registration & Test Center",
      text: "Only one registration is allowed. The candidate selects a city now. The exact test center is printed on the roll number slip after the academy confirms it. The roll number is issued when the academy accepts the registration.",
    },
  ],
  faq: [
    {
      q: "Who is eligible to participate?",
      a: "Male and female applicants who are 25 years of age or younger, and who have up to 16 years of education, may apply. Students of schools, colleges, and madaris are eligible. Postgraduate degree holders are not eligible.",
    },
    {
      q: "What is the registration fee and how do I pay?",
      a: "Pay the announced fee through EasyPaisa, JazzCash, or the Meezan Bank account, then enter the transaction ID and upload the payment receipt with your registration. The academy accepts or rejects the registration. The roll number is issued when the registration is accepted.",
    },
    {
      q: "When will I receive my roll number and admit card?",
      a: "After you submit the form, you receive a registration number immediately. When the academy accepts the application, your roll number is issued and the admit card can be downloaded from this website.",
    },
    {
      q: "Where will the test be held?",
      a: "You select your city at registration. No test center is confirmed yet. The roll number slip shows your city, and the exact address appears on that slip after the academy confirms the center.",
    },
    {
      q: "Which books are included in the syllabus?",
      a: "The complete quiz is based only on Ar-Raheeq Al-Makhtum by Maulana Safi-ur-Rahman Mubarakpuri and Aasan Seerat Muhammad ﷺ by Mufti Mustafa Aziz. No other book is included.",
    },
  ],
};

export function emptyDatabase(passwordHash, jwtSecret) {
  return {
    admin: { username: "admin", passwordHash },
    jwtSecret,
    counters: { registration: 0, roll: 0 },
    settings: defaultSettings,
    registrations: [],
    messages: [],
  };
}
