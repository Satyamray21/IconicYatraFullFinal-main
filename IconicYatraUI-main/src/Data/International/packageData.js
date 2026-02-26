// src/data/allInternationalPackageData.js
import bali1 from "../../assets/packageimg/internationalPackage1.png";
import bali2 from "../../assets/packageimg/internationalPackage1.png";
import bali3 from "../../assets/packageimg/internationalPackage1.png";
import baliHeader from "../../assets/packageimg/internationalPackage1.png";

import thailand1 from "../../assets/packageimg/internationalPackage2.jpg";
import thailand2 from "../../assets/packageimg/internationalPackage2.jpg";
import thailand3 from "../../assets/packageimg/internationalPackage2.jpg";
import thailandHeader from "../../assets/packageimg/internationalPackage2.jpg";

import singapore1 from "../../assets/packageimg/internationalPackage3.png";
import singapore2 from "../../assets/packageimg/internationalPackage3.png";
import singapore3 from "../../assets/packageimg/internationalPackage3.png";
import singaporeHeader from "../../assets/packageimg/internationalPackage3.png";

import malaysia1 from "../../assets/packageimg/internationalPackage4.png";
import malaysia2 from "../../assets/packageimg/internationalPackage4.png";
import malaysia3 from "../../assets/packageimg/internationalPackage4.png";
import malaysiaHeader from "../../assets/packageimg/internationalPackage4.png";

import dubai1 from "../../assets/packageimg/internationalPackage5.png";
import dubai2 from "../../assets/packageimg/internationalPackage5.png";
import dubai3 from "../../assets/packageimg/internationalPackage5.png";
import dubaiHeader from "../../assets/packageimg/internationalPackage5.png";

import europe1 from "../../assets/packageimg/internationalPackage6.png";
import europe2 from "../../assets/packageimg/internationalPackage6.png";
import europe3 from "../../assets/packageimg/internationalPackage6.png";
import europeHeader from "../../assets/packageimg/internationalPackage6.png";

import sriLanka1 from "../../assets/packageimg/internationalPackage1.png";
import sriLanka2 from "../../assets/packageimg/internationalPackage1.png";
import sriLanka3 from "../../assets/packageimg/internationalPackage1.png";
import sriLankaHeader from "../../assets/packageimg/internationalPackage1.png";

import mauritius1 from "../../assets/packageimg/internationalPackage5.png";
import mauritius2 from "../../assets/packageimg/internationalPackage5.png";
import mauritius3 from "../../assets/packageimg/internationalPackage5.png";
import mauritiusHeader from "../../assets/packageimg/internationalPackage5.png";

const allInternationalPackageData = [
  {
    id: 1,
    title: "Bali Paradise Tour - 5N",
    validTill: "31/12/2025",
    priceNote: "Basis 2 person travelling together",
    notValidDuring: ["Christmas", "New Year", "Peak Season"],
    sightseeing: "5 Nights / 6 Days",
    nights: "5 N Bali",
    headerImage: baliHeader,
    days: [
      {
        day: "Day 1 : Arrival in Bali",
        image: bali1,
        description: `Arrive at Ngurah Rai International Airport, meet and greet by our representative. Transfer to hotel for check-in. Rest of the day at leisure. Evening enjoy Kecak dance performance. Overnight in Bali.`,
        note: `Bali is known as the Island of Gods, famous for its volcanic mountains, iconic rice paddies, beaches and coral reefs.`,
      },
      {
        day: "Day 2 : Uluwatu Temple & Kuta Beach",
        image: bali2,
        description: `After breakfast, visit Uluwatu Temple perched on a cliff with stunning ocean views. Later proceed to Kuta Beach for sunset. Enjoy seafood dinner at Jimbaran Bay. Overnight in Bali.`,
      },
      {
        day: "Day 3 : Ubud Cultural Tour",
        image: bali3,
        description: `Full day Ubud tour visiting Sacred Monkey Forest, Ubud Palace, Tegalalang Rice Terrace, and traditional art markets. Experience Balinese culture and craftsmanship. Overnight in Bali.`,
      },
    ],
  },
  {
    id: 2,
    title: "Thailand Experience - 6N",
    validTill: "31/12/2025",
    priceNote: "Basis 2 person travelling together",
    notValidDuring: ["Songkran Festival", "New Year"],
    sightseeing: "6 Nights / 7 Days",
    nights: "3 N Bangkok, 3 N Phuket",
    headerImage: thailandHeader,
    days: [
      {
        day: "Day 1 : Arrival Bangkok",
        image: thailand1,
        description: "Day 1: Arrival in Bangkok Arrive in Bangkok and transfer to your hotel. Relax and unwind after your journey. In the evening, explore the bustling streets or enjoy a peaceful dinner cruise along the Chao Phraya River."
      },
      {
        day: "Day 2 : Bangkok City Tour",
        image: thailand2,
        description: " Experience Bangkok’s vibrant culture with a full-day city tour. Visit iconic landmarks such as the Grand Palace, Wat Pho, and Wat Arun. Explore local markets and enjoy the lively street atmosphere."
      },
      {
        day: "Day 3 : Flight to Phuket",
        image: thailand3,
        description: " Take a morning flight to Phuket, the tropical paradise of Thailand. Check into your hotel and spend the rest of the day relaxing on its pristine beaches or exploring the local surroundings."
      },
    ],
  },
  {
    id: 3,
    title: "Singapore & Malaysia - 5N",
    validTill: "31/12/2025",
    priceNote: "Basis 2 person travelling together",
    notValidDuring: ["Chinese New Year", "Hari Raya"],
    sightseeing: "5 Nights / 6 Days",
    nights: "2 N Singapore, 3 N Kuala Lumpur",
    headerImage: singaporeHeader,
    days: [
      {
        day: "Day 1 : Arrival Singapore",
        image: singapore1,
        description: " Arrive in Singapore and transfer to your hotel. Relax after your journey and enjoy an evening stroll at Marina Bay or explore the vibrant city nightlife."
      },
      {
        day: "Day 2 : Singapore City Tour",
        image: singapore2,
        description: " Embark on a full-day city tour of Singapore. Visit iconic attractions such as Gardens by the Bay, Merlion Park, Sentosa Island, and enjoy the modern charm and cultural diversity of the city."
      },
      {
        day: "Day 3 : Travel to Kuala Lumpur",
        image: singapore3,
        description: " Travel to Kuala Lumpur, Malaysia’s bustling capital. Upon arrival, check into your hotel and spend the evening at leisure, exploring local markets or enjoying the city’s skyline views."
      },
    ],
  },
  {
    id: 4,
    title: "Dubai Extravaganza - 4N",
    validTill: "31/12/2025",
    priceNote: "Basis 2 person travelling together",
    notValidDuring: ["Eid Al Fitr", "Eid Al Adha"],
    sightseeing: "4 Nights / 5 Days",
    nights: "4 N Dubai",
    headerImage: dubaiHeader,
    days: [
      {
        day: "Day 1 : Arrival Dubai",
        image: dubai1,
        description: " Arrive in Dubai and transfer to your hotel. Relax and unwind after your journey. In the evening, enjoy the stunning views of the city or take a leisurely walk along Dubai Marina."
      },
      {
        day: "Day 2 : Dubai City Tour",
        image: dubai2,
        description: " Explore Dubai’s iconic attractions on a full-day city tour. Visit Burj Khalifa, Dubai Mall, Palm Jumeirah, and Jumeirah Mosque. Experience the vibrant culture, modern architecture, and luxurious lifestyle of the city."
      },
      {
        day: "Day 3 : Abu Dhabi Day Trip",
        image: dubai3,
        description: " Take a day trip to Abu Dhabi. Visit the majestic Sheikh Zayed Grand Mosque, explore Yas Island, and witness the grandeur of the UAE’s capital city before returning to Dubai."
      },
    ],
  },
  {
    id: 5,
    title: "European Dream - 7N",
    validTill: "31/12/2025",
    priceNote: "Basis 2 person travelling together",
    notValidDuring: ["Christmas", "Summer Peak Season"],
    sightseeing: "7 Nights / 8 Days",
    nights: "2 N Paris, 2 N Switzerland, 3 N Italy",
    headerImage: europeHeader,
    days: [
      {
        day: "Day 1 : Arrival Paris",
        image: europe1,
        description: " Arrive in Paris and transfer to your hotel. Relax and unwind after your journey. In the evening, enjoy a peaceful walk along the Seine River or explore nearby local cafes."
      },
      {
        day: "Day 2 : Paris City Tour",
        image: europe2,
        description: " Experience the charm of Paris with a full-day city tour. Visit iconic landmarks like the Eiffel Tower, Louvre Museum, Notre-Dame Cathedral, and soak in the city’s romantic ambiance."
      },
      {
        day: "Day 3 : Travel to Switzerland",
        image: europe3,
        description: " Travel from Paris to Switzerland, enjoying scenic views along the way. Check into your hotel and spend the evening relaxing or exploring the local surroundings."
      },
    ],
  },
  {
    id: 6,
    title: "Sri Lanka Explorer - 6N",
    validTill: "31/12/2025",
    priceNote: "Basis 2 person travelling together",
    notValidDuring: ["Sinhala New Year", "Vesak Festival"],
    sightseeing: "6 Nights / 7 Days",
    nights: "2 N Colombo, 2 N Kandy, 2 N Bentota",
    headerImage: sriLankaHeader,
    days: [
      {
        day: "Day 1 : Arrival Colombo",
        image: sriLanka1,
        description: " Arrive in Colombo and transfer to your hotel. Relax and unwind after your journey. In the evening, explore the city at leisure or enjoy a peaceful walk along the coast."
      },
      {
        day: "Day 2 : Kandy Cultural Tour",
        image: sriLanka2,
        description: " Travel to Kandy and immerse yourself in its rich cultural heritage. Visit the Temple of the Tooth, explore traditional markets, and experience the vibrant local culture."
      },
      {
        day: "Day 3 : Bentota Beach Relaxation",
        image: sriLanka3,
        description: " Head to Bentota for a relaxing beach day. Enjoy sunbathing, water activities, or simply unwind by the pristine coastline. Evening at leisure to soak in the serene surroundings."
      },
    ],
  },
  {
    id: 7,
    title: "Mauritius Holiday - 5N",
    validTill: "31/12/2025",
    priceNote: "Basis 2 person travelling together",
    notValidDuring: ["Christmas", "New Year"],
    sightseeing: "5 Nights / 6 Days",
    nights: "5 N Mauritius",
    headerImage: mauritiusHeader,
    days: [
      {
        day: "Day 1 : Arrival Mauritius",
        image: mauritius1,
        description: " Arrive in Mauritius and transfer to your hotel. Relax and unwind after your journey. In the evening, enjoy a stroll along the beach or take in the stunning sunset views."
      },
      {
        day: "Day 2 : North Island Tour",
        image: mauritius2,
        description: " Explore the beauty of North Mauritius, visiting attractions such as Port Louis, Pamplemousses Botanical Garden, and Grand Bay. Experience the local culture, scenic landscapes, and vibrant markets."
      },
      {
        day: "Day 3 : South Island Tour",
        image: mauritius3,
        description: " Discover the charm of South Mauritius, including Chamarel Waterfall, Seven Colored Earths, and Black River Gorges National Park. Enjoy the breathtaking natural beauty and scenic viewpoints."
      },
    ],
  },
  {
    id: 8,
    title: "Malaysia Adventure - 4N",
    validTill: "31/12/2025",
    priceNote: "Basis 2 person travelling together",
    notValidDuring: ["Hari Raya Puasa", "Chinese New Year"],
    sightseeing: "4 Nights / 5 Days",
    nights: "2 N Kuala Lumpur, 2 N Langkawi",
    headerImage: malaysiaHeader,
    days: [
      {
        day: "Day 1 : Arrival Kuala Lumpur",
        image: malaysia1,
        description: " Arrive in Kuala Lumpur and transfer to your hotel. Relax after your journey and spend the evening exploring nearby attractions or enjoying the local cuisine."
      },
      {
        day: "Day 2 : Kuala Lumpur City Tour",
        image: malaysia2,
        description: " Embark on a full-day city tour of Kuala Lumpur. Visit iconic landmarks such as the Petronas Twin Towers, Batu Caves, Merdeka Square, and experience the vibrant culture and modern charm of the city."
      },
      {
        day: "Day 3 : Flight to Langkawi",
        image: malaysia3,
        description: " Take a morning flight to Langkawi, the tropical paradise of Malaysia. Check into your hotel and enjoy the pristine beaches, serene surroundings, or explore local attractions."
      },
    ],
  }
];

export default allInternationalPackageData;