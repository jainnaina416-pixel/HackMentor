import type {
  MentorMessage,
  PitchPack,
  ProblemAnalysis,
  ProjectReview,
  ProjectState,
  ResourceItem,
} from "../types";

function isoHoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function isoHoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export const MOCK_PROBLEM_STATEMENT = `Smallholder farmers lose 20–40% of their harvest to crop diseases that are identified too late. Agricultural extension officers are scarce, and most farmers cannot interpret lab reports or English-language pesticide labels.

Build a practical solution that helps farmers detect common crop diseases early, understand treatment options in their local language, and decide when to seek expert help. The solution should work in low-connectivity rural environments, remain usable on inexpensive Android phones, and avoid recommending unsafe or unavailable chemicals.

Judges will evaluate problem understanding, technical feasibility within 36 hours, real-world usefulness, and a clear demo.`;

export const MOCK_PROJECT_IDEA =
  "CropGuard: an offline-first mobile web app that classifies leaf images, explains the disease in simple language, and recommends locally available treatments with a confidence score.";

export const MOCK_ANALYSIS: ProblemAnalysis = {
  simpleWords:
    "Farmers cannot tell what is wrong with their crops until it is too late. They need a fast, local, low-connectivity way to identify disease and know what to do next.",
  targetUsers: [
    "Smallholder farmers with inexpensive Android phones",
    "Village-level agri-extension volunteers",
    "Farmer-producer organizations coordinating advice",
  ],
  coreProblem:
    "Late and uncertain disease identification, combined with advice that is hard to understand or act on in the field.",
  requirements: [
    "Detect a focused set of high-impact crop diseases from leaf photos",
    "Explain the diagnosis and next action in plain language",
    "Work with intermittent or no internet after first download",
    "Flag low-confidence cases for human follow-up",
    "Produce a demo judges can understand in under 3 minutes",
  ],
  constraints: [
    "36-hour hackathon window",
    "Low-end Android devices and weak rural networks",
    "Avoid over-claiming medical/agri accuracy",
    "Treatment advice must not invent banned chemicals",
  ],
  importantQuestions: [
    "Which 3–5 crops and diseases are in scope for the demo?",
    "Do we have a labeled image set we can actually train or prototype on?",
    "What language(s) should the first demo support?",
    "Is the primary experience a PWA, WhatsApp bot, or native-looking web app?",
  ],
  possibleDirections: [
    "On-device image classifier + explanation cards",
    "Guided symptom questionnaire when photos are unclear",
    "SMS/WhatsApp fallback for farmers without a smartphone camera workflow",
    "Dashboard for an extension officer reviewing flagged cases",
  ],
  risks: [
    "Model accuracy too weak for a convincing demo",
    "Scope creep into too many crops and languages",
    "Offline story that is not actually implemented",
    "Advice that feels generic rather than locally useful",
  ],
};

export const MOCK_RESOURCES: ResourceItem[] = [
  {
    id: "r1",
    name: "PlantVillage Dataset",
    description: "Large public dataset of healthy and diseased crop leaves, useful for a constrained classifier prototype.",
    category: "Datasets",
    source: "Penn State / Hugging Face / Kaggle",
    whyUseful: "Gives the team a realistic image set without spending hours collecting photos.",
    url: "https://huggingface.co/datasets/plantvillage",
  },
  {
    id: "r2",
    name: "TensorFlow Lite",
    description: "On-device inference runtime for converting a compact image model to mobile-friendly format.",
    category: "Libraries",
    source: "Google",
    whyUseful: "Supports the offline-first story judges will ask about.",
    url: "https://www.tensorflow.org/lite",
  },
  {
    id: "r3",
    name: "Open-Meteo",
    description: "Free weather API with no API key for humidity and rainfall context.",
    category: "APIs",
    source: "open-meteo.com",
    whyUseful: "Adds a lightweight environmental signal without auth friction during the hackathon.",
    url: "https://open-meteo.com/",
  },
  {
    id: "r4",
    name: "FAO Plant Production resources",
    description: "Public guidance on crop protection practices and farmer communication.",
    category: "Documentation",
    source: "Food and Agriculture Organization",
    whyUseful: "Keeps treatment copy grounded and less likely to sound invented.",
    url: "https://www.fao.org/plant-production-protection/en",
  },
  {
    id: "r5",
    name: "Teachable Machine",
    description: "Fast image classification prototyping without a full training pipeline.",
    category: "Tools",
    source: "Google",
    whyUseful: "If training time is tight, this can still produce a demo-quality model.",
    url: "https://teachablemachine.withgoogle.com/",
  },
  {
    id: "r6",
    name: "Building crop disease apps for low-resource settings",
    description: "Overview of practical constraints when deploying agri-vision tools.",
    category: "Research papers",
    source: "Academic / open web",
    whyUseful: "Helps the pitch mention real deployment limits instead of hype.",
    url: "https://scholar.google.com",
  },
  {
    id: "r7",
    name: "Plant.id API",
    description: "Commercial plant identification API that can be used as a fallback, not the core demo.",
    category: "APIs",
    source: "Kindwise",
    whyUseful: "Useful comparison point; do not make the whole product depend on it.",
    url: "https://web.plant.id/",
  },
  {
    id: "r8",
    name: "Similar: Plantix",
    description: "Existing farmer crop diagnosis product — study the UX, do not clone it.",
    category: "Similar projects",
    source: "PEATgmbh",
    whyUseful: "Clarifies differentiation: offline-first, local language, and extension-officer handoff.",
    url: "https://plantix.net/",
  },
  {
    id: "r9",
    name: "MDN: Progressive image upload patterns",
    description: "Browser patterns for camera capture and compressed uploads.",
    category: "Tutorials",
    source: "MDN Web Docs",
    whyUseful: "Speeds up the capture flow on mobile browsers.",
    url: "https://developer.mozilla.org/",
  },
];

export const MOCK_REVIEW: ProjectReview = {
  problem:
    "The problem is specific and judge-friendly: late disease identification plus advice that farmers cannot act on. Keep repeating the 20–40% loss stat and the low-connectivity constraint.",
  solution:
    "CropGuard is understandable: photo in, diagnosis + next action out. The offline-first and low-confidence handoff are the parts that make it more than a classifier demo.",
  technicalImplementation:
    "A constrained TensorFlow Lite model, a small disease knowledge card set, and a queue for offline captures is appropriate for 36 hours. A custom foundation model is not.",
  innovation:
    "Differentiation is not the model itself. It is the confidence-aware handoff to an extension volunteer and the local-language action card.",
  feasibility:
    "A 3-crop, 6-disease prototype with one offline path and a 3-minute demo is realistic. A multilingual marketplace of treatments is not.",
  userExperience:
    "The capture screen should be huge, results should be one screen, and the next action should be a verb. Avoid dashboards as the farmer’s first view.",
  risks:
    "Weak accuracy on real leaves, treatment text that sounds unsafe, and a demo that requires perfect lighting.",
  missingPieces:
    "A printed fallback card, a clear ‘not sure’ state, and a judge-facing architecture diagram of what is on-device vs. cloud.",
  recommendedNextSteps: [
    "Freeze scope to tomato, potato, and maize diseases",
    "Finish the offline queue before adding weather features",
    "Write 6 disease action cards in plain language",
    "Rehearse a 3-minute demo with a low-confidence example",
  ],
};

export const MOCK_PITCH: PitchPack = {
  pitch:
    "CropGuard helps smallholder farmers identify crop disease in seconds — even without internet — and tells them what to do next in language they can use.",
  structure: [
    "Hook: a farmer loses a week of harvest to a disease they saw too late",
    "Problem: scarce experts, English labels, weak connectivity",
    "Solution: photo → diagnosis → local action, with a human handoff",
    "How it works: on-device model + knowledge cards + volunteer queue",
    "Demo: healthy leaf, diseased leaf, low-confidence case",
    "Impact & ask: what we would ship after the hackathon",
  ],
  problemExplanation:
    "Extension support does not scale. Farmers wait, guess, or over-spray. The cost is yield, money, and trust.",
  solutionExplanation:
    "A camera-first web app that classifies a focused disease set, explains the result simply, and routes uncertain cases to a volunteer.",
  architectureExplanation:
    "Capture on device → compressed image → TFLite classifier → disease card. If online, optional weather context and volunteer sync. If offline, queue the handoff.",
  demoFlow: [
    "Open CropGuard on a phone",
    "Capture or choose a tomato leaf",
    "Show diagnosis, confidence, and one recommended action",
    "Toggle airplane mode and show the queued volunteer request",
    "End on the architecture slide",
  ],
  talkingPoints: [
    "We chose 3 crops on purpose",
    "Accuracy is bounded and we show uncertainty",
    "Offline is a product requirement, not a slogan",
    "The volunteer handoff is how this survives contact with reality",
  ],
  judgeQuestions: [
    {
      id: "q1",
      question: "How accurate is your model?",
      suggestedAnswer:
        "We are not claiming production accuracy. On our demo set for 6 classes we can distinguish the diseases we scoped. Low-confidence cases go to a human.",
    },
    {
      id: "q2",
      question: "Why not just use Plantix or ChatGPT?",
      suggestedAnswer:
        "Existing apps assume connectivity and broad coverage. We optimized for offline, a tiny disease set, and an explicit human fallback.",
    },
    {
      id: "q3",
      question: "Will farmers trust it?",
      suggestedAnswer:
        "Trust comes from showing uncertainty and connecting to a known volunteer, not from a perfect percentage.",
    },
    {
      id: "q4",
      question: "What would you build with another week?",
      suggestedAnswer:
        "On-device model quantization, two more regional languages, and a volunteer inbox that works over SMS.",
    },
  ],
};

export const MOCK_MESSAGES: MentorMessage[] = [
  {
    id: "m1",
    role: "assistant",
    content:
      "Welcome back, TechNova. You have a sharp problem and a scoped idea. If you only protect one thing tonight, protect the offline demo path and the 3-crop limit.",
    createdAt: isoHoursAgo(5),
  },
  {
    id: "m2",
    role: "user",
    content: "Are we over-scoping this?",
    createdAt: isoHoursAgo(4.8),
  },
  {
    id: "m3",
    role: "assistant",
    content:
      "Slightly, if weather insights stay on the critical path. Keep weather as a nice-to-have. The demo needs: capture, classify, explain, and a low-confidence handoff. Everything else is optional.",
    createdAt: isoHoursAgo(4.7),
  },
];

export function createDemoProject(): ProjectState {
  const startAt = isoHoursAgo(8);
  const deadlineAt = isoHoursFromNow(28);

  const members = [
    {
      id: "u1",
      name: "Aisha Khan",
      role: "Team lead · Full stack",
      skills: ["React", "Product", "FastAPI"],
      avatarHue: 168,
    },
    {
      id: "u2",
      name: "Rohan Mehta",
      role: "ML engineer",
      skills: ["PyTorch", "TFLite", "Computer vision"],
      avatarHue: 28,
    },
    {
      id: "u3",
      name: "Priya Sharma",
      role: "Design · Frontend",
      skills: ["Figma", "UI", "Accessibility"],
      avatarHue: 212,
    },
    {
      id: "u4",
      name: "Vikram Patel",
      role: "Backend · DevOps",
      skills: ["PostgreSQL", "Docker", "Sync"],
      avatarHue: 280,
    },
  ];

  return {
    hackathon: {
      name: "Smart India Hackathon",
      startAt,
      deadlineAt,
    },
    team: {
      name: "TechNova",
      members,
    },
    problemStatement: MOCK_PROBLEM_STATEMENT,
    projectIdea: MOCK_PROJECT_IDEA,
    knownTechnologies: ["React", "Python", "FastAPI", "PostgreSQL", "TensorFlow"],
    analysis: MOCK_ANALYSIS,
    roadmap: {
      generatedAt: isoHoursAgo(6),
      stages: [
        { id: "s1", name: "Understand Problem", order: 1, status: "completed", progress: 100, estimatedHours: 2, deadlineAt: isoHoursAgo(6), taskIds: ["t1"] },
        { id: "s2", name: "Ideation", order: 2, status: "completed", progress: 100, estimatedHours: 2, deadlineAt: isoHoursAgo(5), taskIds: ["t2"] },
        { id: "s3", name: "Validate Idea", order: 3, status: "completed", progress: 100, estimatedHours: 1.5, deadlineAt: isoHoursAgo(4), taskIds: ["t3"] },
        { id: "s4", name: "Architecture", order: 4, status: "completed", progress: 90, estimatedHours: 2, deadlineAt: isoHoursAgo(2), taskIds: ["t4"] },
        { id: "s5", name: "Development", order: 5, status: "in_progress", progress: 45, estimatedHours: 10, deadlineAt: isoHoursFromNow(8), taskIds: ["t5", "t6", "t7"] },
        { id: "s6", name: "Integration", order: 6, status: "not_started", progress: 0, estimatedHours: 4, deadlineAt: isoHoursFromNow(14), taskIds: ["t8"] },
        { id: "s7", name: "Testing", order: 7, status: "not_started", progress: 0, estimatedHours: 3, deadlineAt: isoHoursFromNow(18), taskIds: ["t9"] },
        { id: "s8", name: "Polish", order: 8, status: "not_started", progress: 0, estimatedHours: 2, deadlineAt: isoHoursFromNow(22), taskIds: ["t10"] },
        { id: "s9", name: "Presentation", order: 9, status: "not_started", progress: 10, estimatedHours: 3, deadlineAt: isoHoursFromNow(25), taskIds: ["t11"] },
        { id: "s10", name: "Final Submission", order: 10, status: "not_started", progress: 0, estimatedHours: 1, deadlineAt: deadlineAt, taskIds: ["t12"] },
      ],
    },
    tasks: [
      { id: "t1", name: "Rewrite problem in one paragraph", description: "Strip jargon and name the user, pain, and constraint.", assigneeId: "u1", priority: "high", estimatedHours: 1, deadlineAt: isoHoursAgo(6), status: "DONE", stageId: "s1" },
      { id: "t2", name: "Choose 3-crop demo scope", description: "Tomato, potato, maize only.", assigneeId: "u1", priority: "critical", estimatedHours: 1, deadlineAt: isoHoursAgo(5), status: "DONE", stageId: "s2" },
      { id: "t3", name: "Confirm dataset coverage", description: "Check PlantVillage classes against scoped diseases.", assigneeId: "u2", priority: "high", estimatedHours: 1, deadlineAt: isoHoursAgo(4), status: "DONE", stageId: "s3" },
      { id: "t4", name: "Sketch on-device vs cloud split", description: "One diagram for judges.", assigneeId: "u4", priority: "high", estimatedHours: 2, deadlineAt: isoHoursAgo(2), status: "DONE", stageId: "s4" },
      { id: "t5", name: "Train 6-class leaf classifier", description: "Keep it small enough for TFLite conversion.", assigneeId: "u2", priority: "critical", estimatedHours: 4, deadlineAt: isoHoursFromNow(4), status: "IN_PROGRESS", stageId: "s5" },
      { id: "t6", name: "Build camera capture screen", description: "Large shutter, gallery fallback, compression.", assigneeId: "u3", priority: "high", estimatedHours: 3, deadlineAt: isoHoursFromNow(5), status: "IN_PROGRESS", stageId: "s5" },
      { id: "t7", name: "Disease action cards", description: "Six plain-language treatment cards with ‘seek help’ threshold.", assigneeId: "u1", priority: "high", estimatedHours: 3, deadlineAt: isoHoursFromNow(6), status: "TODO", stageId: "s5" },
      { id: "t8", name: "Offline queue for volunteer handoff", description: "Store pending cases locally and sync later.", assigneeId: "u4", priority: "critical", estimatedHours: 4, deadlineAt: isoHoursFromNow(12), status: "TODO", stageId: "s6" },
      { id: "t9", name: "Low-light capture test", description: "Try 10 messy photos, not studio leaves.", assigneeId: "u3", priority: "medium", estimatedHours: 2, deadlineAt: isoHoursFromNow(16), status: "TODO", stageId: "s7" },
      { id: "t10", name: "Demo script and empty states", description: "Not-sure state, no-camera state, offline badge.", assigneeId: "u3", priority: "medium", estimatedHours: 2, deadlineAt: isoHoursFromNow(20), status: "TODO", stageId: "s8" },
      { id: "t11", name: "Pitch deck skeleton", description: "6 slides max. Rehearse 3 minutes.", assigneeId: "u1", priority: "high", estimatedHours: 2, deadlineAt: isoHoursFromNow(24), status: "TODO", stageId: "s9" },
      { id: "t12", name: "Submission checklist", description: "Repo, video, pitch PDF, working demo URL.", assigneeId: "u4", priority: "critical", estimatedHours: 1, deadlineAt: deadlineAt, status: "TODO", stageId: "s10" },
      { id: "t13", name: "Weather API integration", description: "Optional humidity chip on result screen.", assigneeId: "u4", priority: "low", estimatedHours: 2, deadlineAt: isoHoursFromNow(10), status: "BLOCKED", stageId: "s5" },
    ],
    resources: MOCK_RESOURCES,
    review: null,
    pitch: null,
    messages: MOCK_MESSAGES,
    dashboard: {
      currentStage: "Development",
      progressPercent: 42,
      todayPriorities: [
        "Finish the 6-class classifier export",
        "Ship the camera capture screen",
        "Write disease action cards before adding weather",
      ],
      upcomingDeadlines: [
        { label: "Classifier checkpoint", at: isoHoursFromNow(4) },
        { label: "Offline queue start", at: isoHoursFromNow(12) },
        { label: "Submission", at: deadlineAt },
      ],
      blockers: ["Weather API is blocked on scope — keep it optional."],
      recommendation: {
        headline: "Complete the backend of the diagnosis flow before adding new features.",
        body: "Protect classifier + capture + action cards. Do not start weather or extra languages until the offline queue is in progress.",
        urgency: "focus",
      },
    },
  };
}

export const SUGGESTED_MENTOR_PROMPTS = [
  "What should I do next?",
  "Review our idea",
  "Help us prioritize",
  "Are we over-scoping?",
  "Suggest a tech stack",
  "Find a dataset",
  "Prepare us for judging",
];

export const DEFAULT_STAGES = [
  "Understand Problem",
  "Ideation",
  "Validate Idea",
  "Architecture",
  "Development",
  "Integration",
  "Testing",
  "Polish",
  "Presentation",
  "Final Submission",
];

export function mockMentorReply(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes("over-scop")) {
    return "Yes, if weather, extra languages, and a volunteer marketplace are all treated as must-haves. Freeze 3 crops and 6 diseases. The must-have chain is capture → classify → explain → uncertain handoff. Park weather behind a feature flag.";
  }
  if (p.includes("next") || p.includes("priorit")) {
    return "Next: Rohan finishes TFLite export, Priya ships capture, Aisha writes the 6 action cards. Vikram should start the offline queue as soon as the result payload shape is stable. Do not open new features until those four move.";
  }
  if (p.includes("firebase") || p.includes("postgres") || p.includes("tech stack")) {
    return "For 36 hours: React web app + a tiny FastAPI service + SQLite or Postgres if Vikram already has it running. Firebase is fine for auth-less demo sync, but do not migrate mid-hackathon. On-device inference matters more than the database.";
  }
  if (p.includes("hour") || p.includes("time")) {
    return "Protect the demo path. If time is tight: static disease cards + a pre-exported model + airplane-mode queue screenshot. Judges remember a crisp constraint story more than a half-working extra feature.";
  }
  if (p.includes("judg") || p.includes("tell")) {
    return "Tell judges: the innovation is not ‘AI saw a leaf’. It is scoped diseases, shown uncertainty, and a human fallback that works when the network does not.";
  }
  if (p.includes("dataset")) {
    return "Start with PlantVillage for tomato/potato classes. If maize coverage is thin, use a small custom set of 30 images and say so honestly in the pitch.";
  }
  if (p.includes("idea") || p.includes("solving")) {
    return "Yes — late identification plus unusable advice is the actual problem. CropGuard solves it only if the result screen tells a farmer what to do, not just the disease name.";
  }
  return "Hold the 3-crop scope. Finish classifier, capture, and action cards, then the offline volunteer queue. That is the product. Everything else is a footnote for the pitch.";
}
