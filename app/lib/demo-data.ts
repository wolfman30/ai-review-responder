// Demo mode data — loaded when ?demo=true is in the URL
// This lets anyone preview the full dashboard experience without signing in

export const DEMO_USER = {
  id: "demo-user",
  email: "demo@reviewai.app",
  tier: "business",
  hasGoogle: true,
  locationCount: 3,
};

export const DEMO_LOCATIONS = [
  {
    id: "demo-loc-1",
    name: "The Golden Fork",
    address: "142 W Ontario St, Chicago, IL 60654",
    avgRating: 4.1,
    totalReviews: 18,
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 min ago
    isMonitored: true,
  },
  {
    id: "demo-loc-2",
    name: "Studio Luxe Hair & Beauty",
    address: "2318 N Clark St, Chicago, IL 60614",
    avgRating: 4.4,
    totalReviews: 16,
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 47).toISOString(), // 47 min ago
    isMonitored: true,
  },
  {
    id: "demo-loc-3",
    name: "Bright Smile Family Dentistry",
    address: "900 N Michigan Ave, Suite 310, Chicago, IL 60611",
    avgRating: 4.3,
    totalReviews: 17,
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hrs ago
    isMonitored: true,
  },
];

// Helper to generate dates within the last 3 months (relative to 2026-04-05)
function daysAgo(n: number): string {
  const d = new Date("2026-04-05T10:00:00Z");
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const DEMO_REVIEWS = [
  // ─── The Golden Fork ───────────────────────────────────────────────────────

  {
    id: "demo-r-001",
    locationId: "demo-loc-1",
    authorName: "Marcus T.",
    rating: 1,
    text: "Waited 50 minutes for our food on a Wednesday night — not even busy. When it finally arrived, my pasta was cold and my partner's steak was completely wrong. We flagged our server twice and got nothing but shrugs. Won't be returning.",
    reviewDate: daysAgo(3),
    aiDraft:
      "Hi Marcus, thank you for sharing your experience — and I'm genuinely sorry it fell so short of what you deserved. A 50-minute wait on a quiet night followed by cold food and an incorrect order is not something we ever want a guest to experience. We take this seriously and I'd like to personally make it right. Please reach out to us at feedback@thegoldenfork.com and ask for Michael, our general manager. — The Golden Fork Team",
    finalResponse: null,
    status: "drafted",
    location: { name: "The Golden Fork", id: "demo-loc-1" },
  },
  {
    id: "demo-r-002",
    locationId: "demo-loc-1",
    authorName: "Priya S.",
    rating: 2,
    text: "The bruschetta was soggy and the house wine tasted like it had been open for days. Our server was sweet but clearly overwhelmed — she forgot our bread twice. Not sure what happened; we used to love this place.",
    reviewDate: daysAgo(7),
    aiDraft:
      "Hi Priya, we really appreciate your honest feedback, especially as a returning guest — that means a lot. Soggy bruschetta and wine quality issues are completely valid concerns, and we'll be revisiting both with our kitchen and bar teams right away. We miss having you as a regular and would love the chance to restore your faith in us. Please mention this review when you next visit and we'll take care of you. — The Golden Fork Team",
    finalResponse: null,
    status: "drafted",
    location: { name: "The Golden Fork", id: "demo-loc-1" },
  },
  {
    id: "demo-r-003",
    locationId: "demo-loc-1",
    authorName: "Derek W.",
    rating: 3,
    text: "Decent food, nothing that blew me away. The carbonara was fine but felt a bit heavy. Service was slow but the staff were polite. Ambiance is nice for a date night. Would maybe try again if they fix the pace.",
    reviewDate: daysAgo(11),
    aiDraft:
      "Hi Derek, thanks for giving us a shot and for the balanced feedback. We'd love for your next visit to be the one that really impresses — if you let us know when you're coming in, we'll make sure your experience feels much more polished from start to finish. The carbonara is one we're proud of, but we're always refining. Hope to see you back soon! — The Golden Fork Team",
    finalResponse: null,
    status: "drafted",
    location: { name: "The Golden Fork", id: "demo-loc-1" },
  },
  {
    id: "demo-r-004",
    locationId: "demo-loc-1",
    authorName: "Stephanie L.",
    rating: 4,
    text: "Really lovely dinner. The osso buco was melt-in-your-mouth and the tiramisu was the best I've had outside of Italy. Our server, Anthony, was attentive and funny. Only knocked a star because the noise level made it hard to have a conversation.",
    reviewDate: daysAgo(15),
    aiDraft:
      "Stephanie, this made our whole team's day — especially Anthony! We're so glad the osso buco and tiramisu hit the mark. You're right that the dining room can get loud on busy nights; we're actually looking at acoustic improvements this spring. Thank you for the thoughtful review, and we hope to welcome you back soon for another great meal. — The Golden Fork Team",
    finalResponse: null,
    status: "drafted",
    location: { name: "The Golden Fork", id: "demo-loc-1" },
  },
  {
    id: "demo-r-005",
    locationId: "demo-loc-1",
    authorName: "James K.",
    rating: 5,
    text: "We celebrated our 10th anniversary here and the team went above and beyond. They surprised us with a complimentary dessert plate and even had a card at the table. The food was incredible — the short rib special was extraordinary. Already planning to come back for our 11th!",
    reviewDate: daysAgo(20),
    aiDraft: null,
    finalResponse:
      "James, congratulations on your 10th anniversary — what a milestone! It was our genuine pleasure to be a small part of your celebration. Your kind words mean everything to our team. We'll see you for the 11th! — The Golden Fork Team",
    status: "published",
    location: { name: "The Golden Fork", id: "demo-loc-1" },
  },
  {
    id: "demo-r-006",
    locationId: "demo-loc-1",
    authorName: "Nicole B.",
    rating: 5,
    text: "First time here and I am obsessed. The handmade pasta is the real deal. I had the tagliatelle with truffle butter and I'm still thinking about it two days later. The staff made me feel like a regular even though it was my first visit. 10/10.",
    reviewDate: daysAgo(28),
    aiDraft: null,
    finalResponse:
      "Nicole, welcome — and what a first visit! The truffle tagliatelle is a staff favourite too, so you have great taste. We can't wait to make you feel like a regular again on your next trip in. Thank you for the wonderful review! — The Golden Fork Team",
    status: "published",
    location: { name: "The Golden Fork", id: "demo-loc-1" },
  },
  {
    id: "demo-r-007",
    locationId: "demo-loc-1",
    authorName: "Tom R.",
    rating: 1,
    text: "Found what looked like a piece of plastic in my risotto. Showed it to the manager and she just apologized without offering to comp the dish or anything. I paid $28 for a plate I couldn't finish. This is a food safety issue.",
    reviewDate: daysAgo(33),
    aiDraft: null,
    finalResponse:
      "Tom, we are truly sorry — this is completely unacceptable and does not reflect our standards. We take any foreign object in a dish with the utmost seriousness and have already launched a review of our prep procedures. We should have handled your concern far better in the moment. Please email us directly at feedback@thegoldenfork.com so we can address this properly. — The Golden Fork Team",
    status: "published",
    location: { name: "The Golden Fork", id: "demo-loc-1" },
  },
  {
    id: "demo-r-008",
    locationId: "demo-loc-1",
    authorName: "Aisha N.",
    rating: 4,
    text: "Great spot for a work lunch. Food came out fast, which was impressive for a full restaurant. I had the grilled salmon and it was perfectly cooked. Atmosphere is cozy. Will definitely be back.",
    reviewDate: daysAgo(41),
    aiDraft: null,
    finalResponse:
      "Aisha, so glad we could make your work lunch seamless and delicious! The grilled salmon is a great choice. Looking forward to your next visit — we'll keep the table ready. — The Golden Fork Team",
    status: "published",
    location: { name: "The Golden Fork", id: "demo-loc-1" },
  },
  {
    id: "demo-r-009",
    locationId: "demo-loc-1",
    authorName: "Chris V.",
    rating: 5,
    text: "Came in on a Saturday night without a reservation and they somehow fit us in. The host was incredibly gracious about it. Ended up having one of the best meals I've had all year. The Chef's tasting menu is worth every penny.",
    reviewDate: daysAgo(52),
    aiDraft: null,
    finalResponse:
      "Chris, thank you for this — making walk-ins feel as welcome as reservations is something our team genuinely cares about. We're thrilled the tasting menu delivered. We'd love to see you back, and next time we'll make sure to have a reservation waiting! — The Golden Fork Team",
    status: "published",
    location: { name: "The Golden Fork", id: "demo-loc-1" },
  },

  // ─── Studio Luxe Hair & Beauty ──────────────────────────────────────────────

  {
    id: "demo-r-010",
    locationId: "demo-loc-2",
    authorName: "Brittany F.",
    rating: 1,
    text: "My balayage turned out ORANGE. I showed my stylist exactly what I wanted — a warm honey blonde — and left looking like a traffic cone. When I called to complain, they said I'd need to pay for a correction. Absolutely not. Avoid.",
    reviewDate: daysAgo(2),
    aiDraft:
      "Brittany, we are so sorry — this is not the result we ever want a client to leave with, and your frustration is completely valid. Color corrections are always on us when the result doesn't match what was agreed upon; there should have been no question of charging you. Please call us directly at (312) 555-0182 and ask for our salon director, Kim, who will make this right at no cost to you. — Studio Luxe",
    finalResponse: null,
    status: "drafted",
    location: { name: "Studio Luxe Hair & Beauty", id: "demo-loc-2" },
  },
  {
    id: "demo-r-011",
    locationId: "demo-loc-2",
    authorName: "Rachel M.",
    rating: 2,
    text: "I waited 30 minutes past my appointment time before anyone acknowledged me. The cut itself was fine but felt rushed. For $85, I expect a little more attention to detail and definitely more respect for my time.",
    reviewDate: daysAgo(8),
    aiDraft:
      "Rachel, a 30-minute wait past your appointment time is simply not acceptable — your time is valuable and we failed to honour that. We've spoken with the team about appointment scheduling, and we're adding buffer time between clients to prevent this going forward. We'd love to have you back and give you the experience you originally came in for. Please DM us for a complimentary blow-out on your next visit. — Studio Luxe",
    finalResponse: null,
    status: "drafted",
    location: { name: "Studio Luxe Hair & Beauty", id: "demo-loc-2" },
  },
  {
    id: "demo-r-012",
    locationId: "demo-loc-2",
    authorName: "Diana C.",
    rating: 4,
    text: "Really happy with my highlights! Jessica took her time and the result is exactly what I asked for. The salon is beautiful and very clean. Only thing — the parking situation nearby is rough. Not Studio Luxe's fault obviously, just heads up.",
    reviewDate: daysAgo(13),
    aiDraft:
      "Diana, so happy to hear Jessica nailed your highlights! She's incredibly detail-oriented and loves hearing feedback like this. You're right about parking — our front desk can actually send you a parking guide with nearby garages before your next appointment. Just ask! Thanks for the kind words. — Studio Luxe",
    finalResponse: null,
    status: "drafted",
    location: { name: "Studio Luxe Hair & Beauty", id: "demo-loc-2" },
  },
  {
    id: "demo-r-013",
    locationId: "demo-loc-2",
    authorName: "Kendra J.",
    rating: 5,
    text: "I've been going to Studio Luxe for 3 years and I will never go anywhere else. Maya knows my hair better than I do at this point. The vibe is always relaxed and fun, and I always leave feeling like a million bucks. Best salon in Chicago.",
    reviewDate: daysAgo(18),
    aiDraft:
      "Kendra, three years!! You are family at this point. Maya absolutely lights up when she talks about her long-term clients — this review is going straight to her. Thank you for trusting us with your hair and for this beautiful review. See you soon! — Studio Luxe",
    finalResponse: null,
    status: "drafted",
    location: { name: "Studio Luxe Hair & Beauty", id: "demo-loc-2" },
  },
  {
    id: "demo-r-014",
    locationId: "demo-loc-2",
    authorName: "Olivia T.",
    rating: 5,
    text: "Came in for a bridal trial and was blown away. The team was so accommodating and patient as I kept changing my mind on the updo. Lauren worked magic and kept a smile on her face the whole time. Booking them for the actual wedding day without question.",
    reviewDate: daysAgo(22),
    aiDraft: null,
    finalResponse:
      "Olivia, congratulations on your upcoming wedding!! Lauren absolutely loved working with you. We are so honoured to be part of your big day — the whole team is excited. We'll make sure your wedding morning is as stress-free and beautiful as possible. See you soon! — Studio Luxe",
    status: "published",
    location: { name: "Studio Luxe Hair & Beauty", id: "demo-loc-2" },
  },
  {
    id: "demo-r-015",
    locationId: "demo-loc-2",
    authorName: "Simone G.",
    rating: 3,
    text: "The keratin treatment did smooth things out but I'm not sure it was worth the price. The stylist was nice enough but seemed distracted and didn't really explain the aftercare instructions clearly. I had to Google what products to avoid.",
    reviewDate: daysAgo(30),
    aiDraft: null,
    finalResponse:
      "Simone, thank you for the honest feedback. You're absolutely right — aftercare instructions for a keratin treatment are crucial, and we should have walked you through them clearly before you left the chair. We've updated our post-treatment checkout to include a printed guide going forward. We hope you're loving the results and would welcome you back for a complimentary aftercare consultation. — Studio Luxe",
    status: "published",
    location: { name: "Studio Luxe Hair & Beauty", id: "demo-loc-2" },
  },
  {
    id: "demo-r-016",
    locationId: "demo-loc-2",
    authorName: "Ashley P.",
    rating: 5,
    text: "Walked in with damaged, over-processed hair and walked out with soft, healthy-looking locks. I honestly didn't think it was possible. The deep conditioning treatment they recommended was a game changer. Front desk team is also super friendly.",
    reviewDate: daysAgo(38),
    aiDraft: null,
    finalResponse:
      "Ashley, this is everything we love to hear! Hair rescue missions are our speciality — and you were a trooper through the whole process. The deep conditioning treatment works wonders and we're so glad you trusted us with it. Your hair is going to keep improving! See you next time. — Studio Luxe",
    status: "published",
    location: { name: "Studio Luxe Hair & Beauty", id: "demo-loc-2" },
  },
  {
    id: "demo-r-017",
    locationId: "demo-loc-2",
    authorName: "Tiffany W.",
    rating: 4,
    text: "Great experience overall. Tanya did an amazing job with my cut and styling. The products they use smell incredible. Small gripe: the music in the salon was a bit too loud for a relaxed atmosphere. Would definitely come back though.",
    reviewDate: daysAgo(55),
    aiDraft: null,
    finalResponse:
      "Tiffany, thank you! Tanya is a gem and we'll be sure to pass along your kind words. Noted on the music — we've actually gotten a few comments on that and we're adjusting the volume policy during quieter hours. Really glad you enjoyed the visit and we hope to see you back soon! — Studio Luxe",
    status: "published",
    location: { name: "Studio Luxe Hair & Beauty", id: "demo-loc-2" },
  },

  // ─── Bright Smile Family Dentistry ─────────────────────────────────────────

  {
    id: "demo-r-018",
    locationId: "demo-loc-3",
    authorName: "Gary H.",
    rating: 1,
    text: "Sat in the waiting room for an hour past my scheduled appointment. When I finally got in, the dentist seemed rushed and barely explained anything. I asked about my X-rays and got a 10-second explanation. I'll be finding a new dentist.",
    reviewDate: daysAgo(4),
    aiDraft:
      "Gary, we sincerely apologize for this experience. A one-hour wait is completely unacceptable — your time matters and we clearly failed to respect it. You also deserve a thorough, unhurried explanation of your X-ray results, and we're sorry that didn't happen. We'd welcome the chance to make things right: please call our office manager, Sandra, at (312) 555-0291. We understand if you'd prefer to see another provider and wish you well either way. — Bright Smile Family Dentistry",
    finalResponse: null,
    status: "drafted",
    location: { name: "Bright Smile Family Dentistry", id: "demo-loc-3" },
  },
  {
    id: "demo-r-019",
    locationId: "demo-loc-3",
    authorName: "Linda K.",
    rating: 2,
    text: "The cleaning was fine but I feel like they pushed unnecessary add-ons at every turn. I came in for a routine cleaning and left with a bill for a fluoride treatment and a 'periodontal assessment' I never asked for. Felt a bit like a money grab.",
    reviewDate: daysAgo(9),
    aiDraft:
      "Linda, thank you for raising this concern — it's important feedback that we take seriously. Informed consent is a core part of our practice, and any additional treatments should always be clearly explained and agreed upon before they're performed. We'd like to review your visit and billing with you directly. Please contact our patient coordinator at billing@brightsmilechi.com and we will make sure everything is addressed fairly. — Bright Smile Family Dentistry",
    finalResponse: null,
    status: "drafted",
    location: { name: "Bright Smile Family Dentistry", id: "demo-loc-3" },
  },
  {
    id: "demo-r-020",
    locationId: "demo-loc-3",
    authorName: "Carlos M.",
    rating: 4,
    text: "Really impressed with Dr. Chen and her assistant. They noticed I was nervous (first dentist in 3 years!) and took extra time to explain every step. The cleaning was thorough. Waiting room was clean and calm. Glad I finally came in.",
    reviewDate: daysAgo(14),
    aiDraft:
      "Carlos, welcome back to the dentist's chair — and what a wonderful review! Dr. Chen and the whole team have a real soft spot for patients who've been away for a while; they know how nerve-racking it can be. So glad you felt at ease. Three years down, hopefully just six months until your next visit! — Bright Smile Family Dentistry",
    finalResponse: null,
    status: "drafted",
    location: { name: "Bright Smile Family Dentistry", id: "demo-loc-3" },
  },
  {
    id: "demo-r-021",
    locationId: "demo-loc-3",
    authorName: "Megan T.",
    rating: 5,
    text: "I've been coming here for 5 years with my whole family and we all love it. The hygienists remember us every time and my kids actually look forward to their check-ups. Dr. Patel is incredibly gentle with the kids. Can't recommend highly enough.",
    reviewDate: daysAgo(19),
    aiDraft:
      "Megan, five years of the whole family — you are the heart of what we do! Dr. Patel is going to be so touched to hear your kids look forward to their check-ups (you've made his year). Thank you for trusting us with your family's smiles all this time. See you all at the next appointment! — Bright Smile Family Dentistry",
    finalResponse: null,
    status: "drafted",
    location: { name: "Bright Smile Family Dentistry", id: "demo-loc-3" },
  },
  {
    id: "demo-r-022",
    locationId: "demo-loc-3",
    authorName: "Robert S.",
    rating: 3,
    text: "Decent office but the scheduling system is a mess. I got two different reminder texts with two different appointment times and showed up at the wrong time. Staff were apologetic and fit me in, but it added unnecessary stress.",
    reviewDate: daysAgo(26),
    aiDraft: null,
    finalResponse:
      "Robert, we're really sorry for the scheduling confusion — getting conflicting reminder texts is exactly the kind of thing that should never happen. We've since identified the glitch in our reminder system and have corrected it. We're glad the team was able to accommodate you, but we know it still added unnecessary stress. Thank you for your patience and for letting us know. — Bright Smile Family Dentistry",
    status: "published",
    location: { name: "Bright Smile Family Dentistry", id: "demo-loc-3" },
  },
  {
    id: "demo-r-023",
    locationId: "demo-loc-3",
    authorName: "Jennifer W.",
    rating: 5,
    text: "I had a dental emergency on a Friday afternoon and they got me in within the hour. Dr. Patel was calm, quick, and thorough. The pain was gone by Saturday morning. Absolutely phenomenal service when I needed it most.",
    reviewDate: daysAgo(36),
    aiDraft: null,
    finalResponse:
      "Jennifer, dental emergencies are stressful and we're so relieved we could get you seen quickly and that you were feeling better by Saturday. Dr. Patel and the team will be delighted to hear this. We keep emergency slots available for exactly this reason — thank you for trusting us in your moment of need. — Bright Smile Family Dentistry",
    status: "published",
    location: { name: "Bright Smile Family Dentistry", id: "demo-loc-3" },
  },
  {
    id: "demo-r-024",
    locationId: "demo-loc-3",
    authorName: "David L.",
    rating: 4,
    text: "Very modern facility and skilled staff. My crown procedure was smooth and nearly pain-free (impressive!). The only reason it's 4 stars is the parking garage nearby is expensive and they don't validate. Minor complaint in the grand scheme.",
    reviewDate: daysAgo(44),
    aiDraft: null,
    finalResponse:
      "David, we're thrilled the crown procedure went so smoothly! Fair point on parking — it's something we've heard before and we're actually in discussions with the building management about validation options. Stay tuned. Until then, our reception team can share some street parking tips for the area. Thank you for the thoughtful review! — Bright Smile Family Dentistry",
    status: "published",
    location: { name: "Bright Smile Family Dentistry", id: "demo-loc-3" },
  },
  {
    id: "demo-r-025",
    locationId: "demo-loc-3",
    authorName: "Patricia A.",
    rating: 5,
    text: "I'm terrified of the dentist — always have been. Dr. Chen was the most patient, compassionate dentist I have ever seen. She explained every single thing she was doing before she did it and checked in with me constantly. I left feeling proud of myself. This office changed my relationship with dental care.",
    reviewDate: daysAgo(62),
    aiDraft: null,
    finalResponse:
      "Patricia, reading this brought tears to our eyes — truly. Dental anxiety is real and it takes genuine courage to walk through our door. Dr. Chen is passionate about making dentistry accessible for patients exactly like you, and this message is going on her wall. Thank you for sharing your experience and for trusting us. We'll see you at your next check-up! — Bright Smile Family Dentistry",
    status: "published",
    location: { name: "Bright Smile Family Dentistry", id: "demo-loc-3" },
  },
];

export const DEMO_STATS = {
  locationCount: 3,
  totalReviews: DEMO_REVIEWS.length,
  avgRating:
    Math.round(
      (DEMO_REVIEWS.reduce((sum, r) => sum + r.rating, 0) /
        DEMO_REVIEWS.length) *
        10
    ) / 10,
  responseRate: Math.round(
    (DEMO_REVIEWS.filter((r) => r.status === "published").length /
      DEMO_REVIEWS.length) *
      100
  ),
};
