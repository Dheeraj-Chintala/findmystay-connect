import listing1 from "@/assets/listing-1.jpg";
import listing2 from "@/assets/listing-2.jpg";
import listing3 from "@/assets/listing-3.jpg";
import listing4 from "@/assets/listing-4.jpg";
import listing5 from "@/assets/listing-5.jpg";
import listing6 from "@/assets/listing-6.jpg";

export interface Listing {
  id: string;
  title: string;
  type: "hostel" | "pg" | "co-living";
  gender: "male" | "female" | "co-ed";
  location: string;
  city: string;
  price: number;
  rating: number;
  reviewCount: number;
  image: string;
  images: string[];
  verified: boolean;
  amenities: string[];
  occupancy: string;
  ownerName: string;
  ownerAvatar: string;
  description: string;
  highlights: string[];
  availableFrom: string;
  deposit: number;
  mediaVerificationBadge?: "owner_verified" | "platform_verified" | "premium_verified" | null;
}

export const listings: Listing[] = [
  {
    id: "1",
    title: "Sunrise Co-Living Space",
    type: "co-living",
    gender: "co-ed",
    location: "Koramangala, Bangalore",
    city: "Bangalore",
    price: 8500,
    rating: 4.8,
    reviewCount: 124,
    image: listing1,
    images: [listing1, listing4, listing3],
    verified: true,
    amenities: ["WiFi", "AC", "Laundry", "Gym", "Food", "Parking"],
    occupancy: "Single / Double",
    ownerName: "Rahul Sharma",
    ownerAvatar: "",
    description: "A modern co-living space designed for young professionals. Enjoy community events, high-speed internet, and a fully equipped kitchen. Located just 5 minutes from the metro station.",
    highlights: ["Near Metro", "Community Events", "24/7 Security"],
    availableFrom: "Immediate",
    deposit: 17000,
  },
  {
    id: "2",
    title: "Comfort Boys Hostel",
    type: "hostel",
    gender: "male",
    location: "Andheri West, Mumbai",
    city: "Mumbai",
    price: 6500,
    rating: 4.5,
    reviewCount: 89,
    image: listing2,
    images: [listing2, listing1, listing6],
    verified: true,
    amenities: ["WiFi", "Laundry", "Food", "Power Backup"],
    occupancy: "Triple / Quad",
    ownerName: "Vikram Patel",
    ownerAvatar: "",
    description: "Affordable and clean boys hostel with homely food. Perfect for students attending nearby colleges. Includes three meals a day and weekly room cleaning.",
    highlights: ["Homely Food", "Near College", "Weekly Cleaning"],
    availableFrom: "1st April",
    deposit: 13000,
  },
  {
    id: "3",
    title: "Elite PG for Professionals",
    type: "pg",
    gender: "male",
    location: "Sector 62, Noida",
    city: "Delhi NCR",
    price: 12000,
    rating: 4.9,
    reviewCount: 56,
    image: listing3,
    images: [listing3, listing6, listing4],
    verified: true,
    amenities: ["WiFi", "AC", "Food", "Gym", "Parking", "Power Backup"],
    occupancy: "Single",
    ownerName: "Amit Gupta",
    ownerAvatar: "",
    description: "Premium single-occupancy PG with private study desk, attached washroom, and gourmet meals. Ideal for IT professionals working in Sector 62.",
    highlights: ["Private Room", "Attached Washroom", "Gourmet Meals"],
    availableFrom: "Immediate",
    deposit: 24000,
  },
  {
    id: "4",
    title: "Mingle Student Hub",
    type: "hostel",
    gender: "co-ed",
    location: "Kothrud, Pune",
    city: "Pune",
    price: 5500,
    rating: 4.3,
    reviewCount: 203,
    image: listing4,
    images: [listing4, listing2, listing1],
    verified: false,
    amenities: ["WiFi", "Laundry", "Common Kitchen", "Study Room"],
    occupancy: "Double / Triple",
    ownerName: "Priya Deshmukh",
    ownerAvatar: "",
    description: "Vibrant student hub with a buzzing community. Shared kitchen, game room, and study areas. Walking distance to major engineering colleges.",
    highlights: ["Game Room", "Study Area", "Walking to College"],
    availableFrom: "15th March",
    deposit: 11000,
  },
  {
    id: "5",
    title: "Grace Ladies PG",
    type: "pg",
    gender: "female",
    location: "Indiranagar, Bangalore",
    city: "Bangalore",
    price: 9000,
    rating: 4.7,
    reviewCount: 78,
    image: listing5,
    images: [listing5, listing1, listing3],
    verified: true,
    amenities: ["WiFi", "AC", "Food", "Laundry", "CCTV", "Power Backup"],
    occupancy: "Single / Double",
    ownerName: "Sunita Reddy",
    ownerAvatar: "",
    description: "Safe and elegant ladies PG with 24/7 CCTV surveillance, warden on premises, and homestyle vegetarian meals. Located in the heart of Indiranagar.",
    highlights: ["Women Only", "CCTV Security", "Veg Meals"],
    availableFrom: "Immediate",
    deposit: 18000,
  },
  {
    id: "6",
    title: "Skyline Executive Stay",
    type: "pg",
    gender: "male",
    location: "Whitefield, Bangalore",
    city: "Bangalore",
    price: 15000,
    rating: 4.9,
    reviewCount: 42,
    image: listing6,
    images: [listing6, listing3, listing5],
    verified: true,
    amenities: ["WiFi", "AC", "Food", "Gym", "Pool", "Parking", "Housekeeping"],
    occupancy: "Single",
    ownerName: "Karthik Iyer",
    ownerAvatar: "",
    description: "Luxury executive stay with stunning city views, swimming pool, and daily housekeeping. Perfect for senior professionals who want a premium living experience.",
    highlights: ["City View", "Swimming Pool", "Daily Housekeeping"],
    availableFrom: "1st April",
    deposit: 30000,
  },
];

export const cities = ["All Cities", "Bangalore", "Mumbai", "Delhi NCR", "Pune", "Hyderabad", "Chennai"];
export const propertyTypes = ["All Types", "Hostel", "PG", "Co-Living"];
export const genderOptions = ["All", "Male", "Female", "Co-ed"];
