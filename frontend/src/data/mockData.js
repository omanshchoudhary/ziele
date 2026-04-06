// Shared frontend mock data for Ziele pages

export const mockPosts = [
  {
    id: 1,
    avatar: "OC",
    authorName: "Omansh Choudhary",
    authorHandle: "@omansh",
    time: "2h ago",
    title: "The Future of Web Dev",
    content:
      "As we move further into the decade, the landscape of the web continues to evolve at a breakneck pace. This is a deep dive into what the future holds.",
    tags: ["Technology", "React", "Design"],
    likes: 1200,
    dislikes: 34,
    comments: 56,
    bookmarks: 89,
    views: 8300,
    readTime: "6 min read",
    createdAt: "2026-01-14T10:30:00.000Z",
  },
  {
    id: 2,
    avatar: "ZO",
    authorName: "Ziele Official",
    authorHandle: "@zieleapp",
    time: "5h ago",
    title: "Ziele: Next-Gen Social Blogging",
    content:
      "We're excited to launch Ziele, a platform designed for writers by writers. Our mission is to provide a clean space to share your thoughts.",
    tags: ["Platform", "Updates", "News"],
    likes: 4500,
    dislikes: 22,
    comments: 143,
    bookmarks: 270,
    views: 15200,
    readTime: "5 min read",
    createdAt: "2026-01-14T07:10:00.000Z",
  },
  {
    id: 3,
    avatar: "JS",
    authorName: "Jane Smith",
    authorHandle: "@janesmith",
    time: "1d ago",
    title: "Minimalist UI is Here to Stay",
    content:
      "In an era of information overload, simplicity is the ultimate sophistication. Designers are returning to the basics with minimalist interfaces.",
    tags: ["Design", "UI/UX", "Trends"],
    likes: 892,
    dislikes: 11,
    comments: 38,
    bookmarks: 74,
    views: 4900,
    readTime: "4 min read",
    createdAt: "2026-01-13T12:00:00.000Z",
  },
  {
    id: 4,
    avatar: "AR",
    authorName: "Alex Rivera",
    authorHandle: "@arivera",
    time: "2d ago",
    title: "Shipping Fast with Vite + React",
    content:
      "A practical guide to structuring React apps with Vite for blazing-fast feedback loops and cleaner developer ergonomics.",
    tags: ["React", "Vite", "Performance"],
    likes: 1530,
    dislikes: 19,
    comments: 61,
    bookmarks: 111,
    views: 7100,
    readTime: "7 min read",
    createdAt: "2026-01-12T16:45:00.000Z",
  },
  {
    id: 5,
    avatar: "MC",
    authorName: "Mira Chen",
    authorHandle: "@mirachen",
    time: "3d ago",
    title: "Writing Better Product Stories",
    content:
      "Great products deserve great stories. Learn how to translate product decisions into narratives users instantly connect with.",
    tags: ["Writing", "Product", "Storytelling"],
    likes: 980,
    dislikes: 8,
    comments: 44,
    bookmarks: 92,
    views: 5300,
    readTime: "8 min read",
    createdAt: "2026-01-11T09:20:00.000Z",
  },
];

export const mockNotifications = [
  {
    id: 1,
    type: "follow",
    user: { name: "Alex Rivera", avatar: "https://i.pravatar.cc/150?u=alex" },
    timestamp: "2026-01-14T12:45:00.000Z",
    read: false,
  },
  {
    id: 2,
    type: "comment",
    user: { name: "Sarah Chen", avatar: "https://i.pravatar.cc/150?u=sarah" },
    target: "The Future of Web Dev",
    content: "Great insights! I really loved the part about tRPC.",
    timestamp: "2026-01-14T11:00:00.000Z",
    read: false,
  },
  {
    id: 3,
    type: "like",
    user: {
      name: "Jordan Smith",
      avatar: "https://i.pravatar.cc/150?u=jordan",
    },
    target: "Shipping Fast with Vite + React",
    timestamp: "2026-01-13T15:20:00.000Z",
    read: true,
  },
];

export const mockTrendingTopics = [
  { topic: "Technology", posts: 1280, tag: "#FutureTech" },
  { topic: "Programming", posts: 940, tag: "#JavaScript" },
  { topic: "Design", posts: 710, tag: "#WebDesign" },
  { topic: "Business", posts: 560, tag: "#Startup" },
];

export const mockSuggestions = [
  { name: "John Doe", handle: "@johndoe", avatar: "JD" },
  { name: "Jane Smith", handle: "@janesmith", avatar: "JS" },
  { name: "Alex Rivera", handle: "@arivera", avatar: "AR" },
];

export function formatCompactNumber(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0";
  if (value >= 1000000)
    return `${(value / 1000000).toFixed(1).replace(".0", "")}m`;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(".0", "")}k`;
  return String(value);
}

export const mockDiscoverBlogs = [
  {
    id: 1,
    title: "Writing for a Modern Audience",
    summary:
      "Build content that connects, converts, and keeps readers coming back with a clean writer-first experience.",
    author: "Aurora Lane",
    category: "Writing",
    views: "8.3k",
    readTime: "6 min read",
  },
  {
    id: 2,
    title: "Designing Dark Mode Experiences",
    summary:
      "Learn how subtle contrast, soft glow, and refined spacing create a premium dark interface.",
    author: "Riley Frost",
    category: "UX",
    views: "5.4k",
    readTime: "5 min read",
  },
  {
    id: 3,
    title: "How to Launch a Community Blog",
    summary:
      "A practical guide to turning your platform into an engaging place for creators, readers, and conversations.",
    author: "Mira Patel",
    category: "Community",
    views: "6.1k",
    readTime: "7 min read",
  },
  {
    id: 4,
    title: "Microcopy That Feels Human",
    summary:
      "Tiny words can have a big impact. Write interface text that feels warm, clear, and unmistakably yours.",
    author: "Noah Kim",
    category: "Copywriting",
    views: "3.9k",
    readTime: "4 min read",
  },
  {
    id: 5,
    title: "Turning Notes into Stories",
    summary:
      "Transform scattered ideas into polished narratives with a workflow that keeps momentum and clarity.",
    author: "Sofia Reed",
    category: "Productivity",
    views: "4.8k",
    readTime: "5 min read",
  },
  {
    id: 6,
    title: "Publishing with Purpose",
    summary:
      "Create content that amplifies your voice while staying aligned with your values and long-term goals.",
    author: "Elijah Stone",
    category: "Strategy",
    views: "7.2k",
    readTime: "8 min read",
  },
];

export const mockDiscoverCreators = [
  {
    id: 1,
    initials: "AC",
    name: "Ava Chen",
    handle: "@avachen",
    note: "Creative director sharing design systems and writing tips.",
    followers: "14.2k",
    posts: "128",
  },
  {
    id: 2,
    initials: "LK",
    name: "Luca King",
    handle: "@lucaking",
    note: "Storytelling strategist with daily content prompts.",
    followers: "9.8k",
    posts: "94",
  },
  {
    id: 3,
    initials: "JM",
    name: "Jade Morgan",
    handle: "@jadem",
    note: "Author focused on minimal UX and creator growth.",
    followers: "12.3k",
    posts: "112",
  },
  {
    id: 4,
    initials: "TN",
    name: "Toni Nguyen",
    handle: "@toniny",
    note: "Growth writer sharing creator playbooks and daily habits.",
    followers: "11.6k",
    posts: "104",
  },
];

export const discoverCategories = [
  "Recommended",
  "Writing",
  "UX",
  "Community",
  "Copywriting",
  "Productivity",
  "Strategy",
];

export function getPostById(id) {
  const postId = Number(id);
  return mockPosts.find((post) => post.id === postId) || null;
}

export function getRandomPost() {
  if (mockPosts.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * mockPosts.length);
  return mockPosts[randomIndex];
}

export const mockProfiles = [
  {
    id: "omansh",
    name: "Omansh Choudhary",
    handle: "@omansh",
    bio: "Founding Ziele. Architecting the future of social blogging with a focus on minimalism and speed. 🖋️✨",
    avatar: "OC",
    followers: 12400,
    following: 892,
    posts: 45,
    likes: 38000,
    streak: 12,
    isPremium: true,
    joined: "January 2024",
  },
  {
    id: "janesmith",
    name: "Jane Smith",
    handle: "@janesmith",
    bio: "Design systems, minimalist UI, and thoughtful product writing.",
    avatar: "JS",
    followers: 9800,
    following: 410,
    posts: 32,
    likes: 21400,
    streak: 6,
    isPremium: false,
    joined: "March 2024",
  },
  {
    id: "arivera",
    name: "Alex Rivera",
    handle: "@arivera",
    bio: "Frontend engineer sharing practical React and performance tips.",
    avatar: "AR",
    followers: 7600,
    following: 530,
    posts: 27,
    likes: 16300,
    streak: 9,
    isPremium: true,
    joined: "May 2024",
  },
];

export function getProfileById(profileId) {
  if (!profileId) return mockProfiles[0] || null;
  const normalized = String(profileId).toLowerCase().replace(/^@/, "");
  return (
    mockProfiles.find((profile) => profile.id.toLowerCase() === normalized) ||
    mockProfiles.find(
      (profile) =>
        profile.handle.toLowerCase().replace(/^@/, "") === normalized,
    ) ||
    mockProfiles[0] ||
    null
  );
}

export function getRelatedPosts(postId) {
  const current = getPostById(postId);
  if (!current) return [];

  return mockPosts
    .filter((post) => post.id !== current.id)
    .map((post) => {
      const overlap = post.tags.filter((tag) =>
        current.tags.includes(tag),
      ).length;
      return { ...post, _score: overlap };
    })
    .sort((a, b) => b._score - a._score || b.likes - a.likes)
    .map(({ _score, ...post }) => post)
    .slice(0, 3);
}
export const mockComments = [
  {
    id: 1,
    postId: 1,
    authorName: "Sarah Chen",
    authorHandle: "@sarahc",
    avatar: "SC",
    content: "This is exactly what the web needs! Great insights on the future of development.",
    time: "1h ago",
    createdAt: "2026-01-14T11:30:00.000Z",
  },
  {
    id: 2,
    postId: 1,
    authorName: "Alex Rivera",
    authorHandle: "@arivera",
    avatar: "AR",
    content: "I'm curious about how AI will play into this. Have you considered the impact of LLMs on code quality?",
    time: "45m ago",
    createdAt: "2026-01-14T11:45:00.000Z",
  },
  {
    id: 3,
    postId: 2,
    authorName: "John Doe",
    authorHandle: "@johndoe",
    avatar: "JD",
    content: "Ziele looks amazing! I've been waiting for a platform like this.",
    time: "2h ago",
    createdAt: "2026-01-14T10:10:00.000Z",
  },
];

export function getCommentsByPostId(postId) {
  const id = Number(postId);
  return mockComments
    .filter((comment) => comment.postId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addComment(postId, commentData) {
  const newComment = {
    id: Date.now(),
    postId: Number(postId),
    ...commentData,
    createdAt: new Date().toISOString(),
    time: "Just now",
  };
  mockComments.unshift(newComment);
  return newComment;
}

export function deleteComment(commentId) {
  const index = mockComments.findIndex((c) => c.id === commentId);
  if (index !== -1) {
    mockComments.splice(index, 1);
    return true;
  }
  return false;
}
export const mockCommunities = [
  {
    id: 1,
    name: "Tech Enclave",
    members: 12400,
    tags: ["React", "JavaScript", "Architecture"],
    description: "The primary hub for all things software engineering. Discuss the latest frameworks and best practices.",
    category: "Technology",
    icon: "💻"
  },
  {
    id: 2,
    name: "Writers' Guild",
    members: 8900,
    tags: ["Storytelling", "Editing", "Fiction"],
    description: "A sanctuary for writers. Share drafts, get feedback, and hone your craft.",
    category: "Writing",
    icon: "✍️"
  },
  {
    id: 3,
    name: "Design Collective",
    members: 15600,
    tags: ["UI/UX", "Product Design", "Figma"],
    description: "Visual thinkers and problem solvers unit here to share inspiration and resources.",
    category: "UX",
    icon: "🎨"
  },
  {
    id: 4,
    name: "Productivity Lab",
    members: 11200,
    tags: ["Habits", "Focus", "Tools"],
    description: "Master your workflow and optimize your daily life for peak performance.",
    category: "Productivity",
    icon: "⚡"
  },
  {
    id: 5,
    name: "Growth Strategy",
    members: 9500,
    tags: ["SaaS", "Marketing", "Scaling"],
    description: "Insights and playbooks for scaling products and building sustainable businesses.",
    category: "Strategy",
    icon: "📈"
  },
  {
    id: 6,
    name: "Minimalist Life",
    members: 7800,
    tags: ["Lifestyle", "Simplicity", "Digital Detox"],
    description: "Exploring the beauty of less. Practical tips for a simpler, more meaningful life.",
    category: "Community",
    icon: "🍃"
  }
];
