// src/data/allDomesticPackageData.js
import guwahati1 from "../../assets/packageimg/package1.png";
import guwahati2 from "../../assets/packageimg/package1.png";
import guwahati3 from "../../assets/packageimg/package1.png";
import guwahatiHeader from "../../assets/packageimg/package1.png";

import holy1 from "../../assets/packageimg/package2.png";
import holy2 from "../../assets/packageimg/package2.png";
import holy3 from "../../assets/packageimg/package2.png";
import holyHeader from "../../assets/packageimg/package2.png";

import kashi1 from "../../assets/packageimg/package3.png";
import kashi2 from "../../assets/packageimg/package3.png";
import kashi3 from "../../assets/packageimg/package3.png";
import kashiHeader from "../../assets/packageimg/package3.png";

import ayodhya1 from "../../assets/packageimg/package4.jpg";
import ayodhya2 from "../../assets/packageimg/package4.jpg";
import ayodhya3 from "../../assets/packageimg/package4.jpg";
import ayodhyaHeader from "../../assets/packageimg/package4.jpg";

import odisha1 from "../../assets/packageimg/package5.png";
import odisha2 from "../../assets/packageimg/package5.png";
import odisha3 from "../../assets/packageimg/package5.png";
import odishaHeader from "../../assets/packageimg/package5.png";

import uniqueOdisha1 from "../../assets/packageimg/package6.png";
import uniqueOdisha2 from "../../assets/packageimg/package6.png";
import uniqueOdisha3 from "../../assets/packageimg/package6.png";
import uniqueOdishaHeader from "../../assets/packageimg/package6.png";

import meghalaya1 from "../../assets/packageimg/package1.png";
import meghalaya2 from "../../assets/packageimg/package1.png";
import meghalaya3 from "../../assets/packageimg/package1.png";
import meghalayaHeader from "../../assets/packageimg/package1.png";

import goa1 from "../../assets/packageimg/package3.png";
import goa2 from "../../assets/packageimg/package3.png";
import goa3 from "../../assets/packageimg/package3.png";
import goaHeader from "../../assets/packageimg/package3.png";

const allDomesticPackageData = [
  {
    id: 1,
    title: "2N Guwahati",
    validTill: "31/12/2025",
    priceNote: "Basis 2 person travelling together",
    notValidDuring: ["Diwali", "New Year", "Long Weekend"],
    sightseeing: "2 Nights / 3 Days",
    nights: "2 N Guwahati",
    headerImage: guwahatiHeader,
    days: [
      {
        day: "Day 1 : Guwahati-Guwahati",
        image: guwahati1,
        description: `Assistance on arrival at the Guwahati airport later checks in to your hotel. 
        As time permits we may take a tour of the Kamakhya Temple. Evening enjoy at Brahmaputra River Cruise (Ticket cost not Included). 
        Overnight in Guwahati.`,
        note: `Guwahati, formerly known as Gauhati is a city of the Indian state of Assam and also the largest metropolis in northeastern India. 
        It has several ancient Hindu temples including the Umananda Temple, Navagraha Temple, and Basistha Temple.`,
      },
      {
        day: "Day 2 : Local SightSeeing At Guwahati",
        image: guwahati2,
        description: `After breakfast visit a full day sightseeing of Guwahati. 
        We may take a tour of temples in Guwahati like Purva Tirupati Shri Balaji Temple, Sukreswar Temple, Navagraha Temple, Umananda Temple at Peacock Island, 
        Assam State Museum, DighaliPukhuri (Lake), State Zoo cum Botanical Garden, Planetarium and Assam State Emporiums. 
        Later proceed to the hotel and complete check in. Overnight in Guwahati.`,
      },
      {
        day: "Day 3 : Guwahati-Guwahati",
        image: guwahati3,
        description: `Post breakfast check out from the hotel and take transfer to the Guwahati Airport for your onward journey.`,
      },
    ],
  },
  {
    id: 2,
    title: "Holy Tringle Tour-4N",
    validTill: "31/12/2025",
    priceNote: "Basis 2 person travelling together",
    notValidDuring: ["Diwali", "New Year"],
    sightseeing: "4 Nights / 5 Days",
    nights: "4 N",
    headerImage: holyHeader,
    days: [
      {
        day: "Day 1 : Arrival & Local Darshan",
        image: holy1,
        description:
          " Arrive at your destination and check into your hotel. After settling in, visit nearby temples for an introductory darshan. Experience the calm and spiritual vibes of the local surroundings while preparing for the journey ahead.",
      },
      {
        day: "Day 2 : Temple Exploration",
        image: holy2,
        description:
          " Start the day with visits to the prominent temples of the Holy Triangle. Witness the rituals, feel the devotion, and explore each temple’s unique architecture and history. Immerse yourself fully in the spiritual environment.",
      },
      {
        day: "Day 3 : Travel & Divine Visits",
        image: holy3,
        description:
          " Proceed to the next holy site, enjoying scenic travel along the way. Once there, participate in temple darshan and soak in the sacred atmosphere. Evening at leisure to reflect and relax.",
      },
      {
        day: "Day 4 :  Departure",
        image: holy1,
        description:
          " After breakfast, check out and begin your journey home, taking with you unforgettable memories, spiritual blessings, and a sense of inner peace.",
      },
    ],
  },
  {
    id: 3,
    title: "Kashi Darshan with Triveni Sangam-3N",
    validTill: "31/12/2025",
    priceNote: "Basis 2 person travelling together",
    notValidDuring: ["Diwali", "New Year"],
    sightseeing: "3 Nights / 4 Days",
    nights: "3 N",
    headerImage: kashiHeader,
    days: [
      {
        day: "Day 1 : Arrival Kashi",
        image: kashi1,
        description: " Arrive in the sacred city of Kashi and check into your hotel. Take some time to relax before beginning your spiritual journey. In the evening, enjoy a serene visit to local temples and soak in the divine atmosphere of this holy city.",
      },
      {
        day: "Day 2 : Full Day Darshan",
        image: kashi2,
        description: " Spend the day exploring Kashi’s renowned temples and sacred sites. Participate in rituals, experience the devotion of the pilgrims, and witness the timeless spiritual traditions. Capture memorable moments as you immerse yourself fully in this divine city.",
      },
      {
        day: "Day 3 : Local Visit & Departure",
        image: kashi3,
        description: " After breakfast, visit important local landmarks, including the Triveni Sangam. Take in the spiritual significance and scenic beauty before checking out from your hotel. Begin your onward journey with cherished memories and blessings from this sacred pilgrimage.",
      },
    ],
  },
  {
    id: 4,
    title: "Ayodhya & Beyond Temple Tour-2N",
    validTill: "31/12/2025",
    priceNote: "Basis 2 person travelling together",
    notValidDuring: ["Diwali", "New Year"],
    sightseeing: "2 Nights / 3 Days",
    nights: "2 N",
    headerImage: ayodhyaHeader,
    days: [
      {
        day: "Day 1 : Arrival & Temple Visit",
        image: ayodhya1,
        description: " Arrive in Ayodhya and check into your hotel. After some rest, begin your spiritual journey with visits to nearby temples. Witness the sacred rituals and soak in the divine ambiance as you start your exploration of this holy city.",
      },
      {
        day: "Day 2 : Full Day Ayodhya Tour",
        image: ayodhya2,
        description: " Spend the entire day visiting Ayodhya’s most revered temples and historic sites. Explore the city’s rich cultural heritage, participate in temple ceremonies, and experience the spiritual essence that makes Ayodhya a major pilgrimage destination.",
      },
      {
        day: "Day 3 : Departure",
        image: ayodhya3,
        description: " After breakfast, check out from your hotel and begin your onward journey. Take back unforgettable memories, spiritual blessings, and a peaceful heart from your Ayodhya pilgrimage.",
      },
    ],
  },
  {
    id: 5,
    title: "SEA SHORE OF ODISHA (Puri 2N - Bhubaneswar 1N - Gopalpur 2N)",
    validTill: "31/12/2025",
    priceNote: "Basis 2 person travelling together",
    notValidDuring: ["Diwali", "New Year"],
    sightseeing: "5 Nights / 6 Days",
    nights: "5 N",
    headerImage: odishaHeader,
    days: [
      {
        day: "Day 1 : Arrival Puri",
        image: odisha1,
        description: " Arrive in Puri and check into your hotel. Spend the rest of the day relaxing and enjoying the coastal ambiance. In the evening, take a peaceful stroll along the beach and soak in the serene surroundings.",
      },
      {
        day: "Day 2 : Puri Sightseeing",
        image: odisha2,
        description: " Explore the famous temples and landmarks of Puri, including the iconic Jagannath Temple. Enjoy the vibrant local culture, colorful markets, and the scenic beauty of the coastal city.",
      },
      {
        day: "Day 3 : Bhubaneswar Visit",
        image: odisha3,
        description: " Travel to Bhubaneswar, the city of temples. Visit prominent temples, historical monuments, and cultural sites that showcase the rich heritage of Odisha.",
      },
      {
        day: "Day 4 : Travel Gopalpur",
        image: odisha1,
        description: " Journey to the tranquil beach town of Gopalpur. Check into your hotel and enjoy the scenic coastline. Evening at leisure to relax and unwind.",
      },
      {
        day: "Day 5 : Explore Gopalpur",
        image: odisha2,
        description: " Spend the day exploring Gopalpur’s pristine beaches and local attractions. Indulge in water activities or simply enjoy the peaceful seaside atmosphere.",
      },
      {
        day: "Day 6 : Departure",
        image: odisha3,
        description: " After breakfast, check out from your hotel and begin your onward journey. Take with you beautiful memories of Odisha’s spiritual and coastal treasures.",
      },
    ],
  },
  {
    id: 6,
    title: "UNIQUE ODISHA (Puri 3N - Bhubaneswar 1N)",
    validTill: "31/12/2025",
    priceNote: "Basis 2 person travelling together",
    notValidDuring: ["Diwali", "New Year"],
    sightseeing: "4 Nights / 5 Days",
    nights: "4 N",
    headerImage: uniqueOdishaHeader,
    days: [
      {
        day: "Day 1 : Arrival Puri",
        image: uniqueOdisha1,
        description: " Arrive in Puri and check into your hotel. Relax and unwind as you enjoy the peaceful coastal surroundings. In the evening, take a stroll along the beach and get a glimpse of the local culture.",
      },
      {
        day: "Day 2 : Puri Sightseeing",
        image: uniqueOdisha2,
        description: "Spend the day visiting Puri’s famous temples and attractions, including the renowned Jagannath Temple. Explore the vibrant markets and experience the rich cultural and spiritual heritage of this coastal city.",
      },
      {
        day: "Day 3 : Bhubaneswar Visit",
        image: uniqueOdisha3,
        description: "Travel to Bhubaneswar, the temple city of India. Explore its historic temples, cultural landmarks, and architectural marvels that reflect Odisha’s heritage.",
      },
      {
        day: "Day 4 : Departure",
        image: uniqueOdisha1,
        description: " After breakfast, check out from your hotel and begin your journey home. Carry with you unforgettable memories of Odisha’s spiritual, cultural, and scenic treasures.",
      },
    ],
  },
  {
    id: 7,
    title: "7N Meghalaya + Assam",
    validTill: "31/12/2025",
    priceNote: "Basis 2 person travelling together",
    notValidDuring: ["Diwali", "New Year"],
    sightseeing: "7 Nights / 8 Days",
    nights: "7 N",
    headerImage: meghalayaHeader,
    days: [
      {
        day: "Day 1 : Arrival Assam",
        image: meghalaya1,
        description: "Arrive in Assam and check into your hotel. Relax after your journey and enjoy the serene surroundings. Evening at leisure to unwind and prepare for the adventure ahead.",
      },
      {
        day: "Day 2 : Assam Sightseeing",
        image: meghalaya2,
        description: " Explore the beauty of Assam with visits to its famous landmarks, temples, and cultural sites. Experience the rich traditions and vibrant culture of this northeastern state.",
      },
      {
        day: "Day 3 : Travel Meghalaya",
        image: meghalaya3,
        description: " Journey to the scenic state of Meghalaya. Enjoy the lush landscapes along the way and check into your hotel upon arrival. Evening at leisure.",
      },
      {
        day: "Day 4 : Meghalaya Sightseeing",
        image: meghalaya1,
        description: " Discover Meghalaya’s natural wonders, including waterfalls, caves, and breathtaking viewpoints. Immerse yourself in the serene beauty of this “abode of clouds.”",
      },
      {
        day: "Day 5 : Explore Meghalaya",
        image: meghalaya2,
        description: " Continue exploring Meghalaya’s scenic destinations and local culture. Visit charming villages, enjoy panoramic views, and capture unforgettable memories.",
      },
      {
        day: "Day 6 : Back to Assam",
        image: meghalaya3,
        description: " Travel back to Assam and check into your hotel. Spend the evening relaxing or enjoying local attractions before departure.",
      },
      {
        day: "Day 7 : Departure",
        image: meghalaya1,
        description: " After breakfast, check out from your hotel and begin your onward journey, taking home memories of the picturesque landscapes and rich culture of Assam and Meghalaya.",
      },
    ],
  },
  {
    id: 8,
    title: "Magical Goa 2N",
    validTill: "31/12/2025",
    priceNote: "Basis 2 person travelling together",
    notValidDuring: ["Diwali", "New Year"],
    sightseeing: "2 Nights / 3 Days",
    nights: "2 N Goa",
    headerImage: goaHeader,
    days: [
      {
        day: "Day 1 : Arrival & Beach Visit",
        image: goa1,
        description: " Arrive in Goa and check into your hotel. Spend the day relaxing at the pristine beaches, soaking up the sun, and enjoying the soothing sea breeze. Evening at leisure to explore the local markets or enjoy beachside activities.",
      },
      {
        day: "Day 2 : Goa Sightseeing",
        image: goa2,
        description: " Embark on a full-day sightseeing tour of Goa. Visit popular attractions including historic churches, vibrant markets, scenic forts, and lively beaches. Experience Goa’s unique blend of culture, history, and coastal charm.",
      },
      {
        day: "Day 3 : Departure",
        image: goa3,
        description: " After breakfast, check out from your hotel and begin your onward journey. Take home beautiful memories of Goa’s stunning beaches, cultural heritage, and lively atmosphere.",
      },
    ],
  },
];

export default allDomesticPackageData;