export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  credential: string;
  experience: number;
  rating: number;
  reviews: number;
  fee: number;
  location: string;
  initials: string;
  tone: "blue" | "peach" | "lavender";
  languages: string[];
  modes: Array<"video" | "clinic">;
  bio: string;
};

export const doctors: Doctor[] = [
  {
    id: "dr-ava-shah",
    name: "Dr. Ava Shah",
    specialty: "Cardiologist",
    credential: "MBBS, MD (Cardiology)",
    experience: 12,
    rating: 4.9,
    reviews: 286,
    fee: 850,
    location: "Bandra West, Mumbai",
    initials: "AS",
    tone: "blue",
    languages: ["English", "Hindi", "Gujarati"],
    modes: ["video", "clinic"],
    bio: "Dr. Ava Shah brings a thoughtful, prevention-first approach to heart health. She supports patients through everyday concerns and long-term cardiac care with clear guidance at every step.",
  },
  {
    id: "dr-meera-nair",
    name: "Dr. Meera Nair",
    specialty: "Dermatologist",
    credential: "MBBS, MD (Dermatology)",
    experience: 9,
    rating: 4.8,
    reviews: 194,
    fee: 700,
    location: "Indiranagar, Bengaluru",
    initials: "MN",
    tone: "peach",
    languages: ["English", "Hindi", "Malayalam"],
    modes: ["video", "clinic"],
    bio: "Dr. Meera Nair combines evidence-led dermatology with practical routines that fit real life. Consult about skin, hair and wellness in a comfortable, judgment-free conversation.",
  },
  {
    id: "dr-leo-martin",
    name: "Dr. Leo Martin",
    specialty: "General physician",
    credential: "MBBS, DNB (Family Medicine)",
    experience: 15,
    rating: 4.9,
    reviews: 372,
    fee: 550,
    location: "Koramangala, Bengaluru",
    initials: "LM",
    tone: "lavender",
    languages: ["English", "Hindi", "Tamil"],
    modes: ["video", "clinic"],
    bio: "Dr. Leo Martin helps families make sense of common health concerns, preventive checkups and next steps. His calm, practical style keeps every appointment focused and easy to follow.",
  },
  {
    id: "dr-priya-kapoor",
    name: "Dr. Priya Kapoor",
    specialty: "Pediatrician",
    credential: "MBBS, DCH, Fellowship in Pediatrics",
    experience: 11,
    rating: 4.9,
    reviews: 241,
    fee: 750,
    location: "Jubilee Hills, Hyderabad",
    initials: "PK",
    tone: "peach",
    languages: ["English", "Hindi", "Telugu"],
    modes: ["video", "clinic"],
    bio: "Dr. Priya Kapoor partners with parents on childhood wellness, development and everyday questions, bringing a reassuring and attentive approach to each visit.",
  },
  {
    id: "dr-isha-roy",
    name: "Dr. Isha Roy",
    specialty: "Psychiatrist",
    credential: "MBBS, MD (Psychiatry)",
    experience: 8,
    rating: 4.8,
    reviews: 168,
    fee: 900,
    location: "Salt Lake, Kolkata",
    initials: "IR",
    tone: "lavender",
    languages: ["English", "Hindi", "Bengali"],
    modes: ["video"],
    bio: "Dr. Isha Roy creates a thoughtful space for mental wellbeing. Her collaborative approach focuses on listening, informed choices and practical care plans.",
  },
  {
    id: "dr-arjun-menon",
    name: "Dr. Arjun Menon",
    specialty: "Orthopedic surgeon",
    credential: "MBBS, MS (Orthopedics)",
    experience: 13,
    rating: 4.7,
    reviews: 203,
    fee: 800,
    location: "Alwarpet, Chennai",
    initials: "AM",
    tone: "blue",
    languages: ["English", "Hindi", "Tamil"],
    modes: ["video", "clinic"],
    bio: "Dr. Arjun Menon focuses on helping people move comfortably again, with careful assessment and clear options for joint, muscle and bone concerns.",
  },
];

export const specialties = [
  { name: "Cardiology", detail: "Heart health", icon: "heart" },
  { name: "Dermatology", detail: "Skin & hair", icon: "sparkles" },
  { name: "Pediatrics", detail: "Care for kids", icon: "baby" },
  { name: "Psychiatry", detail: "Mental wellbeing", icon: "brain" },
  { name: "Orthopedics", detail: "Bones & joints", icon: "bone" },
  { name: "General physician", detail: "Everyday care", icon: "stethoscope" },
];

export type DemoAppointment = {
  id: string;
  doctorId: string;
  patient: string;
  start: Date;
  type: "video" | "clinic";
  status: "confirmed" | "pending" | "completed";
  payment: "Held in demo" | "Released";
};

export function getDoctor(id: string) {
  return doctors.find((doctor) => doctor.id === id) ?? doctors[0];
}

export function getDemoAppointments(): DemoAppointment[] {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(10, 30, 0, 0);
  const inThreeDays = new Date(now);
  inThreeDays.setDate(now.getDate() + 3);
  inThreeDays.setHours(14, 0, 0, 0);
  const lastWeek = new Date(now);
  lastWeek.setDate(now.getDate() - 7);
  lastWeek.setHours(11, 0, 0, 0);
  return [
    { id: "appt-cw-1042", doctorId: doctors[0].id, patient: "Maya Patel", start: tomorrow, type: "video", status: "confirmed", payment: "Held in demo" },
    { id: "appt-cw-1078", doctorId: doctors[1].id, patient: "Maya Patel", start: inThreeDays, type: "clinic", status: "pending", payment: "Held in demo" },
    { id: "appt-cw-0931", doctorId: doctors[2].id, patient: "Maya Patel", start: lastWeek, type: "video", status: "completed", payment: "Released" },
  ];
}
