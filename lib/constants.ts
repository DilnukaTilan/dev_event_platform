export interface Event {
  title: string;
  image: string;
  slug: string;
  location: string;
  date: string;
  time: string;
}

export const events: Event[] = [
  {
    title: "Microsoft Ignite 2025",
    image: "/images/img_1.jpeg",
    slug: "microsoft-ignite-2025",
    location: "San Francisco, CA",
    date: "November 18-21, 2025",
    time: "9:00 AM - 5:00 PM PST",
  },
  {
    title: "GitHub Universe 2025",
    image: "/images/img_2.jpg",
    slug: "github-universe-2025",
    location: "San Francisco, CA",
    date: "October 28-29, 2025",
    time: "8:30 AM - 7:00 PM PST",
  },
  {
    title: "AWS re:Invent 2025",
    image: "/images/img_3.jpeg",
    slug: "aws-reinvent-2025",
    location: "Las Vegas, NV",
    date: "December 1-5, 2025",
    time: "8:00 AM - 8:00 PM PST",
  },
  {
    title: "CES 2026",
    image: "/images/img_4.jpg",
    slug: "ces-2026",
    location: "Las Vegas, NV",
    date: "January 6-9, 2026",
    time: "9:00 AM - 6:00 PM PST",
  },
  {
    title: "Infobip Shift 2025",
    image: "/images/img_5.jpg",
    slug: "infobip-shift-2025",
    location: "Zadar, Croatia",
    date: "September 14-16, 2025",
    time: "09:00 AM - 05:00 PM CET",
  },
  {
    title: "Esri Developer Summit 2026",
    image: "/images/img_6.jpg",
    slug: "esri-developer-summit-2026",
    location: "Palm Springs, CA",
    date: "March 10-13, 2026",
    time: "9:00 AM - 5:00 PM PST",
  },
  {
    title: "KubeCon Europe 2026",
    image: "/images/img_7.jpeg",
    slug: "kubecon-europe-2026",
    location: "Amsterdam, Netherlands",
    date: "March 23-26, 2026",
    time: "08:00 AM - 5:00 PM CET",
  },
  {
    title: "LEAP 2026",
    image: "/images/img_8.jpg",
    slug: "leap-2026",
    location: "Riyadh, Saudi Arabia",
    date: "April 13-16, 2026",
    time: "9:00 AM - 6:00 PM AST",
  },
  {
    title: "Google I/O 2025",
    image: "/images/img_9.jpg",
    slug: "google-io-2025",
    location: "Mountain View, CA",
    date: "May 20-21, 2025",
    time: "10:00 AM - 6:00 PM PST",
  },
];
