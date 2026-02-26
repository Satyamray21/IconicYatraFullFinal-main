// src/data/specialPackagesData.js
import mussoorie1 from "../assets/packageimg/package1.png";
import mussoorie2 from "../assets/packageimg/package1.png";
import mussoorie3 from "../assets/packageimg/package1.png";
import mussoorieHeader from "../assets/packageimg/package1.png";

import nepal1 from "../assets/packageimg/package2.png";
import nepal2 from "../assets/packageimg/package2.png";
import nepal3 from "../assets/packageimg/package2.png";
import nepalHeader from "../assets/packageimg/package2.png";

import manali1 from "../assets/packageimg/package3.png";
import manali2 from "../assets/packageimg/package3.png";
import manali3 from "../assets/packageimg/package3.png";
import manaliHeader from "../assets/packageimg/package3.png";

import kerala1 from "../assets/packageimg/package4.jpg";
import kerala2 from "../assets/packageimg/package4.jpg";
import kerala3 from "../assets/packageimg/package4.jpg";
import keralaHeader from "../assets/packageimg/package4.jpg";

import scenicKerala1 from "../assets/packageimg/package5.png";
import scenicKerala2 from "../assets/packageimg/package5.png";
import scenicKerala3 from "../assets/packageimg/package5.png";
import scenicKeralaHeader from "../assets/packageimg/package5.png";

import southernHills1 from "../assets/packageimg/package6.png";
import southernHills2 from "../assets/packageimg/package6.png";
import southernHills3 from "../assets/packageimg/package6.png";
import southernHillsHeader from "../assets/packageimg/package6.png";

const specialPackagesData = [
    {
        id: 1,
        title: "Mussoorie - Rishikesh - Nainital",
        validTill: "31/12/2025",
        priceNote: "Basis 2 persons travelling together",
        notValidDuring: ["Diwali", "New Year", "Long Weekend"],
        sightseeing: "5 Nights / 6 Days",
        nights: "5 N",
        headerImage: mussoorieHeader,
        days: [
            { day: "Day 1 : Arrival Mussoorie", image: mussoorie1, description: "Check-in and local sightseeing in Mussoorie." },
            { day: "Day 2 : Mussoorie Sightseeing", image: mussoorie2, description: "Explore Kempty Falls, Mall Road, Gun Hill." },
            { day: "Day 3 : Travel to Rishikesh", image: mussoorie3, description: "Transfer to Rishikesh and evening Ganga Aarti." },
            { day: "Day 4 : Rishikesh Sightseeing", image: mussoorie1, description: "Visit Laxman Jhula, Ram Jhula, Triveni Ghat." },
            { day: "Day 5 : Travel to Nainital", image: mussoorie2, description: "Drive to Nainital and local market visit." },
            { day: "Day 6 : Departure", image: mussoorie3, description: "Check-out and transfer to onward destination." },
        ],
    },
    {
        id: 2,
        title: "8N Amazing Nepal",
        validTill: "31/12/2025",
        priceNote: "Basis 2 persons travelling together",
        notValidDuring: ["Diwali", "New Year"],
        sightseeing: "8 Nights / 9 Days",
        nights: "8 N",
        headerImage: nepalHeader,
        days: [
            { day: "Day 1 : Arrival Kathmandu", image: nepal1, description: "Arrival and transfer to hotel." },
            { day: "Day 2 : Kathmandu Sightseeing", image: nepal2, description: "Full day sightseeing in Kathmandu valley." },
            { day: "Day 3 : Travel to Pokhara", image: nepal3, description: "Drive to Pokhara and evening leisure." },
            { day: "Day 4 : Pokhara Sightseeing", image: nepal1, description: "Local attractions including Phewa Lake." },
            { day: "Day 5 : Chitwan National Park", image: nepal2, description: "Travel to Chitwan and jungle activities." },
            { day: "Day 6 : Safari & Village Tour", image: nepal3, description: "Enjoy safari and cultural show." },
            { day: "Day 7 : Back to Kathmandu", image: nepal1, description: "Return to Kathmandu." },
            { day: "Day 8 : Departure", image: nepal2, description: "Check-out and onward journey." },
        ],
    },
    {
        id: 3,
        title: "Manali Volvo 3 Nights Tour : Ex Delhi",
        validTill: "31/12/2025",
        priceNote: "Basis 2 persons travelling together",
        notValidDuring: ["Diwali", "New Year"],
        sightseeing: "3 Nights / 4 Days",
        nights: "3 N",
        headerImage: manaliHeader,
        days: [
            { day: "Day 1 : Delhi to Manali (Volvo)", image: manali1, description: "Overnight journey by Volvo bus." },
            { day: "Day 2 : Manali Arrival & Sightseeing", image: manali2, description: "Local sightseeing including Hadimba Temple." },
            { day: "Day 3 : Solang Valley Tour", image: manali3, description: "Excursion to Solang Valley." },
            { day: "Day 4 : Departure", image: manali1, description: "Check-out and Volvo back to Delhi." },
        ],
    },
    {
        id: 4,
        title: "Explore Kerala",
        validTill: "31/12/2025",
        priceNote: "Basis 2 persons travelling together",
        notValidDuring: ["Diwali", "New Year"],
        sightseeing: "5 Nights / 6 Days",
        nights: "5 N",
        headerImage: keralaHeader,
        days: [
            { day: "Day 1 : Arrival Cochin", image: kerala1, description: "Arrival and sightseeing in Cochin." },
            { day: "Day 2 : Cochin to Munnar", image: kerala2, description: "Drive to Munnar, tea garden visits." },
            { day: "Day 3 : Munnar Sightseeing", image: kerala3, description: "Explore Eravikulam National Park, Mattupetty Dam." },
            { day: "Day 4 : Munnar to Thekkady", image: kerala1, description: "Proceed to Thekkady, enjoy spice plantations." },
            { day: "Day 5 : Alleppey Houseboat", image: kerala2, description: "Stay in houseboat, backwater experience." },
            { day: "Day 6 : Departure", image: kerala3, description: "Check-out and onward journey." },
        ],
    },
    {
        id: 5,
        title: "07 Nights / 08 Days Scenic Kerala",
        validTill: "31/12/2025",
        priceNote: "Basis 2 persons travelling together",
        notValidDuring: ["Diwali", "New Year"],
        sightseeing: "7 Nights / 8 Days",
        nights: "7 N",
        headerImage: scenicKeralaHeader,
        days: [
            { day: "Day 1 : Arrival Cochin", image: scenicKerala1, description: "Arrival and Cochin sightseeing." },
            { day: "Day 2 : Cochin to Munnar", image: scenicKerala2, description: "Drive to Munnar and sightseeing." },
            { day: "Day 3 : Explore Munnar", image: scenicKerala3, description: "Visit local attractions in Munnar." },
            { day: "Day 4 : Munnar to Thekkady", image: scenicKerala1, description: "Proceed to Thekkady and boat ride." },
            { day: "Day 5 : Thekkady to Alleppey", image: scenicKerala2, description: "Houseboat stay in Alleppey." },
            { day: "Day 6 : Alleppey to Kumarakom", image: scenicKerala3, description: "Backwater sightseeing." },
            { day: "Day 7 : Kumarakom to Cochin", image: scenicKerala1, description: "Drive back to Cochin, shopping." },
            { day: "Day 8 : Departure", image: scenicKerala2, description: "Check-out and onward journey." },
        ],
    },
    {
        id: 6,
        title: "Southern Hills 4N",
        validTill: "31/12/2025",
        priceNote: "Basis 2 persons travelling together",
        notValidDuring: ["Diwali", "New Year"],
        sightseeing: "4 Nights / 5 Days",
        nights: "4 N",
        headerImage: southernHillsHeader,
        days: [
            { day: "Day 1 : Arrival Ooty", image: southernHills1, description: "Check-in and local Ooty sightseeing." },
            { day: "Day 2 : Explore Ooty", image: southernHills2, description: "Full day Ooty tour." },
            { day: "Day 3 : Ooty to Kodaikanal", image: southernHills3, description: "Transfer to Kodaikanal and leisure." },
            { day: "Day 4 : Kodaikanal Sightseeing", image: southernHills1, description: "Explore Kodaikanal attractions." },
            { day: "Day 5 : Departure", image: southernHills2, description: "Check-out and onward journey." },
        ],
    },
];

export default specialPackagesData;