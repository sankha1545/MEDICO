// src/frontend/pages/patient/HealthBlog.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { BackgroundAnimation } from '../../components/animations/BackGroundAnimations';
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

interface PostCategory {
  id: string;
  name: string;
  count: number;
}

export default function HealthBlog() {
  // Sample posts
  const allPosts: BlogPost[] = [
    {
      id: 1,
      title: '5 Tips for a Stronger Immune System',
      excerpt:
        'Discover simple lifestyle changes—nutrition, sleep habits, exercise routines—that keep your immune system in top shape year‑round.',
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
        'Stress can take a toll on your health. Learn mindfulness techniques, breathing exercises, and daily habits to reduce anxiety and boost well‑being.',
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
        'You don’t need to spend a fortune to eat well. Explore budget‑friendly grocery tips, meal prepping strategies, and nutritious recipes.',
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

  const categories: PostCategory[] = [
    { id: 'all', name: 'All Posts', count: allPosts.length },
    {
      id: 'Wellness',
      name: 'Wellness',
      count: allPosts.filter(p => p.category === 'Wellness').length,
    },
    {
      id: 'Nutrition',
      name: 'Nutrition',
      count: allPosts.filter(p => p.category === 'Nutrition').length,
    },
    {
      id: 'Mental Health',
      name: 'Mental Health',
      count: allPosts.filter(p => p.category === 'Mental Health').length,
    },
    {
      id: 'Technology',
      name: 'Technology',
      count: allPosts.filter(p => p.category === 'Technology').length,
    },
  ];

  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>(allPosts);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Filter posts by category & search term
  useEffect(() => {
    const byCategory = selectedCategory === 'all'
      ? allPosts
      : allPosts.filter(p => p.category === selectedCategory);

    const bySearch = byCategory.filter(p =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredPosts(bySearch);
  }, [selectedCategory, searchTerm]);

  // Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };
  const cardHover = {
    scale: 1.02,
    y: -5,
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    transition: { duration: 0.3 },
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-100">
      <BackgroundAnimation />

      <main className="relative z-10 text-gray-900">
        <div className="max-w-6xl px-6 py-16 mx-auto sm:px-8 lg:px-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-12"
          >

            {/* Hero Section */}
            <motion.div variants={itemVariants} className="text-center">
              <motion.h1
                className="mb-4 text-6xl font-bold text-transparent md:text-7xl bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text"
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                Health & Wellness Blog
              </motion.h1>
              <motion.p
                className="max-w-3xl mx-auto text-xl text-gray-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Stay inspired with cutting-edge insights on nutrition, fitness, mental health, and more.
              </motion.p>
            </motion.div>

            {/* Search Bar */}
            <motion.div variants={itemVariants} className="max-w-2xl mx-auto">
              <div className="relative overflow-hidden bg-white shadow-md rounded-2xl">
                <div className="flex items-center px-4 py-3">
                  <Search className="w-6 h-6 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full ml-3 text-lg text-gray-800 placeholder-gray-500 bg-transparent focus:outline-none"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Category Filter */}
            <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-5 py-2 rounded-2xl transition-all duration-300 ${
                    selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {cat.name} ({cat.count})
                </button>
              ))}
            </motion.div>

            {/* Posts Grid */}
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence>
                {filteredPosts.map(post => (
                  <motion.div
                    key={post.id}
                    variants={itemVariants}
                    whileHover={cardHover}
                    layout
                    className="overflow-hidden bg-white shadow-md cursor-pointer rounded-3xl"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={post.img}
                        alt={post.title}
                        className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="mb-2 text-2xl font-bold text-gray-800">
                        {post.title}
                      </h3>
                      <p className="mb-4 text-sm text-gray-600">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
                        <span>{post.date}</span>
                        <span>
                          by <strong className="text-gray-700">{post.author}</strong>
                        </span>
                      </div>
                      <a
                        href={post.link}
                        className="inline-block font-medium text-purple-600 hover:underline"
                      >
                        Read More →
                      </a>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Load More */}
            <motion.div variants={itemVariants} className="text-center">
              <button className="px-8 py-3 font-semibold text-white transition-transform bg-purple-600 rounded-full hover:scale-105">
                Load More Posts
              </button>
            </motion.div>

            {/* Chatbot */}
            <motion.div variants={itemVariants} className="mt-16">
              <Chatbot />
            </motion.div>

          </motion.div>
        </div>
      </main>
    </div>
  );
}
