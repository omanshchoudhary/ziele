import { prisma } from "../src/models/prismaClient.js";

const users = [
  {
    clerkId: "seed_user_1",
    email: "john.doe@example.com",
    username: "johndoe",
    firstName: "John",
    lastName: "Doe",
    imageUrl: "https://i.pravatar.cc/150?u=john",
    profile: {
      id: "johndoe",
      name: "John Doe",
      handle: "johndoe",
      bio: "Full-stack developer building the future of the web. Passionate about React, Node.js, and open source.",
      avatar: "JD",
      joined: "April 2026",
      isPremium: true,
      streak: 5,
    }
  },
  {
    clerkId: "seed_user_2",
    email: "jane.smith@example.com",
    username: "janesmith",
    firstName: "Jane",
    lastName: "Smith",
    imageUrl: "https://i.pravatar.cc/150?u=jane",
    profile: {
      id: "janesmith",
      name: "Jane Smith",
      handle: "janesmith",
      bio: "UX/UI Designer & Tech Enthusiast. I write about design systems, accessibility, and modern web aesthetics.",
      avatar: "JS",
      joined: "April 2026",
      isPremium: false,
      streak: 12,
    }
  },
  {
    clerkId: "seed_user_3",
    email: "alice.j@example.com",
    username: "alicej",
    firstName: "Alice",
    lastName: "Johnson",
    imageUrl: "https://i.pravatar.cc/150?u=alice",
    profile: {
      id: "alicej",
      name: "Alice Johnson",
      handle: "alicej",
      bio: "AI Researcher exploring machine learning, NLP, and the ethics of artificial intelligence.",
      avatar: "AJ",
      joined: "March 2026",
      isPremium: true,
      streak: 42,
    }
  },
  {
    clerkId: "seed_user_4",
    email: "dev.mike@example.com",
    username: "devmike",
    firstName: "Mike",
    lastName: "Chen",
    imageUrl: "https://i.pravatar.cc/150?u=mike",
    profile: {
      id: "devmike",
      name: "Mike Chen",
      handle: "devmike",
      bio: "DevOps Engineer. I automate things so you don't have to.",
      avatar: "MC",
      joined: "February 2026",
      isPremium: false,
      streak: 1,
    }
  }
];

const posts = [
  {
    authorHandle: "johndoe",
    title: "Mastering React Server Components in 2026",
    content: "<p>React Server Components (RSC) have fundamentally changed how we build web applications. By shifting the rendering workload to the server, we can achieve unparalleled performance without sacrificing the interactivity we love.</p><h2>Why RSCs Matter</h2><p>Traditional client-side rendering forces the browser to download large bundles of JavaScript. RSCs allow you to keep heavy dependencies on the server. Imagine rendering a complex markdown parser without sending a single byte of its code to the client!</p><blockquote><p>\"The future of React is server-first.\"</p></blockquote><p>We are entering an era where full-stack React is not just a buzzword, but a necessity for building scalable architectures.</p>",
    tags: ["React", "WebDev", "JavaScript"],
    coverUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1000&auto=format&fit=crop",
    likes: 124,
    views: 1540,
    language: "English"
  },
  {
    authorHandle: "johndoe",
    title: "The Death of the Traditional REST API?",
    content: "<p>Is REST dead? Not exactly, but the landscape is shifting rapidly. Technologies like GraphQL, tRPC, and Server Actions are making traditional REST endpoints feel clunky and overly verbose.</p><p>With tRPC, you get end-to-end typesafety without code generation. You simply define a router on the server and consume it on the client. It's a magical developer experience.</p><p>While REST will always have its place in public-facing APIs, internal application development is moving towards tightly coupled, highly typed procedures.</p>",
    tags: ["API", "Backend", "tRPC", "NodeJS"],
    coverUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop",
    likes: 89,
    views: 920,
    language: "English"
  },
  {
    authorHandle: "janesmith",
    title: "Designing for Accessibility: More Than Just Contrast",
    content: "<p>Accessibility (a11y) is often treated as an afterthought—a checkbox to tick off before launch. But true accessibility is baked into the design process from day one.</p><h2>Focus States are Essential</h2><p>Never remove outline styles without providing an alternative. Keyboard users rely entirely on focus indicators to navigate your application. A beautiful design is worthless if it cannot be used by everyone.</p><p>Let's commit to building an inclusive web.</p>",
    tags: ["Design", "Accessibility", "UX"],
    coverUrl: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?q=80&w=1000&auto=format&fit=crop",
    likes: 210,
    views: 3100,
    language: "English"
  },
  {
    authorHandle: "janesmith",
    title: "Micro-interactions: The Secret to Delightful UI",
    content: "<p>The difference between a good app and a great app often lies in the micro-interactions. Those tiny, subtle animations that provide feedback and make the interface feel alive.</p><p>When a user clicks a 'like' button, don't just instantly change the color. Add a slight scale effect, maybe a tiny burst particle animation. It rewards the user for their action.</p>",
    tags: ["Design", "UI", "Animation"],
    coverUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=1000&auto=format&fit=crop",
    likes: 342,
    views: 4500,
    language: "English"
  },
  {
    authorHandle: "alicej",
    title: "Understanding Large Language Models: A Beginner's Guide",
    content: "<p>Large Language Models (LLMs) like GPT-4 and Gemini are everywhere, but how do they actually work? At their core, they are highly sophisticated prediction engines.</p><h2>The Transformer Architecture</h2><p>The breakthrough that made modern AI possible is the Transformer architecture, introduced in the seminal paper \"Attention is All You Need\". It allows the model to weigh the importance of different words in a sentence, giving it a profound \"understanding\" of context.</p><p>As we push the boundaries of scale, we are seeing emergent capabilities that even the researchers didn't explicitly program.</p>",
    tags: ["AI", "MachineLearning", "Tech"],
    coverUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop",
    likes: 450,
    views: 8900,
    language: "English"
  },
  {
    authorHandle: "devmike",
    title: "Why You Should Learn Docker in 2026",
    content: "<p>Docker isn't just for operations teams anymore. Every developer needs to understand containerization. It solves the classic \"it works on my machine\" problem once and for all.</p><p>By defining your environment in a Dockerfile, you ensure that your application runs exactly the same way in development, staging, and production.</p><p>Start simple: containerize a basic Node.js app. Then explore Docker Compose for multi-container setups. It will supercharge your productivity.</p>",
    tags: ["DevOps", "Docker", "Backend"],
    coverUrl: "https://images.unsplash.com/photo-1605745341112-85968b19335b?q=80&w=1000&auto=format&fit=crop",
    likes: 112,
    views: 1250,
    language: "English"
  }
];

async function main() {
  console.log("Cleaning existing data...");
  // Delete in reverse order of dependencies
  await prisma.comment.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.emailReminderLog.deleteMany();
  await prisma.post.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating Users and Profiles...");
  for (const userData of users) {
    const { profile, ...user } = userData;
    await prisma.user.create({
      data: {
        ...user,
        profile: {
          create: profile
        }
      }
    });
  }

  console.log("Creating Posts...");
  const createdProfiles = await prisma.profile.findMany();
  const profileMap = createdProfiles.reduce((acc, p) => {
    acc[p.handle] = p;
    return acc;
  }, {});

  for (const post of posts) {
    const author = profileMap[post.authorHandle];
    if (!author) continue;

    await prisma.post.create({
      data: {
        profileId: author.id,
        authorName: author.name,
        authorHandle: author.handle,
        avatar: author.avatar,
        title: post.title,
        content: post.content,
        tags: post.tags,
        likes: post.likes,
        views: post.views,
        coverUrl: post.coverUrl,
        language: post.language,
      }
    });
  }

  console.log("Creating some Follows...");
  // Everyone follows Jane
  for (const profile of createdProfiles) {
    if (profile.handle !== "janesmith") {
      await prisma.follow.create({
        data: {
          followerId: profile.id,
          followingId: profileMap["janesmith"].id
        }
      });
    }
  }
  
  // John follows Alice
  await prisma.follow.create({
    data: {
      followerId: profileMap["johndoe"].id,
      followingId: profileMap["alicej"].id
    }
  });

  console.log("Creating Comments...");
  const allPosts = await prisma.post.findMany();
  const john = profileMap["johndoe"];
  const jane = profileMap["janesmith"];
  const alice = profileMap["alicej"];
  const mike = profileMap["devmike"];

  if (allPosts.length > 0) {
    const post1 = allPosts[0]; // John's post
    await prisma.comment.create({
      data: {
        postId: post1.id,
        profileId: jane.id,
        authorName: jane.name,
        authorHandle: jane.handle,
        avatar: jane.avatar,
        content: "Fantastic overview! RSCs are definitely the future."
      }
    });
    
    const post2 = allPosts[2]; // Jane's accessibility post
    await prisma.comment.create({
      data: {
        postId: post2.id,
        profileId: alice.id,
        authorName: alice.name,
        authorHandle: alice.handle,
        avatar: alice.avatar,
        content: "So true! Great emphasis on focus states."
      }
    });

    const post3 = allPosts[4]; // Alice's LLM post
    await prisma.comment.create({
      data: {
        postId: post3.id,
        profileId: mike.id,
        authorName: mike.name,
        authorHandle: mike.handle,
        avatar: mike.avatar,
        content: "Very helpful for someone coming from ops. Need to learn more about attention mechanisms."
      }
    });
  }

  // Update follower counts
  console.log("Updating profile stats...");
  for (const profile of createdProfiles) {
    const followers = await prisma.follow.count({ where: { followingId: profile.id } });
    const following = await prisma.follow.count({ where: { followerId: profile.id } });
    const postsCount = await prisma.post.count({ where: { profileId: profile.id } });
    
    await prisma.profile.update({
      where: { id: profile.id },
      data: { followers, following, postsCount }
    });
  }

  console.log("Seed complete! 🚀");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
