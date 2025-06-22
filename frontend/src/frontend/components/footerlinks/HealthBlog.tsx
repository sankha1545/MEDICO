// src/frontend/pages/patient/HealthBlog.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Chatbot from '../../components/common/chatbot/chatbot';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  img: string;
  date: string;
  author: string;
  category: string;
  link: string;
}

// sample data
const allPosts: BlogPost[] = [
  {
    id: 1,
    title: '5 Tips for a Stronger Immune System',
    excerpt:
      'Discover simple lifestyle changes—nutrition, sleep habits, exercise routines—that can help keep your immune system in top shape year-round.',
    img: '/blog/immune-system.jpg',
    date: 'June 1, 2025',
    author: 'Dr. Sarah Lee',
    category: 'Wellness',
    link: '/blog/immune-system',
  },
  {
    id: 2,
    title: 'Managing Stress in a Busy World',
    excerpt:
      'Stress can take a toll on your health. Learn mindfulness techniques, breathing exercises, and daily habits to reduce anxiety and boost well-being.',
    img: '/blog/stress-management.jpg',
    date: 'May 20, 2025',
    author: 'Emily Chen',
    category: 'Mental Health',
    link: '/blog/stress-management',
  },
  {
    id: 3,
    title: 'Healthy Eating on a Budget',
    excerpt:
      'You don’t need to spend a fortune to eat well. Explore budget-friendly grocery tips, meal prepping strategies, and nutritious recipes.',
    img: '/blog/healthy-eating.jpg',
    date: 'May 10, 2025',
    author: 'James Patel',
    category: 'Nutrition',
    link: '/blog/healthy-eating',
  },
  {
    id: 4,
    title: 'The Benefits of Telehealth Services',
    excerpt:
      'Telehealth is transforming how you access care. Understand the perks, limitations, and best practices for virtual doctor visits.',
    img: '/blog/telehealth-benefits.jpg',
    date: 'April 28, 2025',
    author: 'Dr. Sarah Lee',
    category: 'Technology',
    link: '/blog/telehealth-benefits',
  },
  // ...add more posts if needed
];

const categories = ['All', 'Wellness', 'Nutrition', 'Mental Health', 'Technology'];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6 } },
  hover: { scale: 1.03, y: -5, boxShadow: '0px 10px 20px rgba(0,0,0,0.15)' },
};

export default function HealthBlog() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [posts, setPosts] = useState<BlogPost[]>(allPosts);

  // scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // filter posts whenever category changes
  useEffect(() => {
    setPosts(
      selectedCategory === 'All'
        ? allPosts
        : allPosts.filter((p) => p.category === selectedCategory)
    );
  }, [selectedCategory]);

  const handleCategoryClick = useCallback((cat: string) => {
    setSelectedCategory(cat);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-16 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      {/* Hero */}
      <div className="max-w-3xl mx-auto text-center mb-12 relative">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl sm:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500"
        >
          Health & Wellness Blog
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-4 text-lg text-gray-700"
        >
          Stay inspired with cutting-edge insights on nutrition, fitness, mental health, and more.
        </motion.p>
        {/* Floating Circles */}
        <motion.div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-purple-200 opacity-20"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.1, 0.2] }}
          transition={{ repeat: Infinity, duration: 6 }}
        />
        <motion.div
          className="absolute bottom-0 right-10 w-32 h-32 rounded-full bg-pink-200 opacity-20"
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.05, 0.2] }}
          transition={{ repeat: Infinity, duration: 5, delay: 1 }}
        />
      </div>

      {/* Category Filter */}
      <motion.div
        className="max-w-4xl mx-auto mb-8 flex justify-center space-x-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {categories.map((cat) => (
          <motion.button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-full shadow-md transition-colors duration-200 ${
              selectedCategory === cat
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-purple-100'
            }`}
          >
            {cat}
          </motion.button>
        ))}
      </motion.div>

      {/* Posts Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        <AnimatePresence>
          {posts.map((post) => (
            <motion.div
              key={post.id}
              variants={cardVariants}
              whileHover="hover"
              initial="hidden"
              animate="visible"
              layout
              className="relative bg-white rounded-3xl overflow-hidden cursor-pointer"
            >
              {/* Image */}
              <div className="relative h-60 overflow-hidden">
                <img
                  src={post.img}
                  alt={post.title}
                  loading="lazy"
                  className="w-full h-full object-cover transform transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-40" />
                <span className="absolute top-3 left-3 bg-purple-500 text-white text-xs font-semibold uppercase px-3 py-1 rounded-full">
                  {post.category}
                </span>
              </div>

              {/* Content */}
              <div className="p-6">
                <motion.h3
                  className="text-2xl font-bold text-gray-800 mb-2"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                >
                  {post.title}
                </motion.h3>
                <motion.p
                  className="text-gray-600 text-sm mb-4"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  {post.excerpt}
                </motion.p>
                <div className="flex items-center justify-between text-gray-500 text-xs mb-4">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    {post.date}
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.5 }}
                  >
                    by <span className="font-semibold text-gray-700">{post.author}</span>
                  </motion.span>
                </div>
                <motion.a
                  href={post.link}
                  whileHover={{ x: 5 }}
                  className="inline-block text-purple-600 font-medium hover:underline"
                >
                  Read More →
                </motion.a>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Load More */}
      <div className="mt-16 text-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative inline-block px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-lg font-semibold rounded-full overflow-hidden shadow-lg"
        >
          <span className="relative z-10">Load More Posts</span>
          <motion.span
            className="absolute inset-0 bg-white opacity-0 rounded-full"
            whileHover={{ opacity: 0.1, scale: 1.2 }}
            transition={{ duration: 0.5 }}
          />
        </motion.button>
      </div>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
}
