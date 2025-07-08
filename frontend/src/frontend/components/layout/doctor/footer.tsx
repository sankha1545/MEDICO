// File: frontend/src/components/common/footer/DoctorFooter.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Float, OrbitControls, Text as DreiText } from '@react-three/drei';
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';

export const DoctorFooter: React.FC = () => {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative pt-20 pb-8 overflow-hidden text-white bg-gradient-to-tr from-gray-900 via-purple-900 to-black">
      {/* 3D Floating Logo */}
      <div className="absolute top-0 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none left-1/2 w-72 h-72">
        <Canvas>
          <Float speed={1} rotationIntensity={1} floatIntensity={2}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[2, 5, 2]} intensity={1} />
            <DreiText
              font="/fonts/Inter-Bold.woff"
              fontSize={3}
              color="#6EE7B7"
              anchorX="center"
              anchorY="middle"
            >
             
            </DreiText>
          </Float>
          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.3} />
        </Canvas>
      </div>

      <div className="relative px-6 mx-auto max-w-7xl lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Profile Summary */}
          <section>
            <h3 className="mb-4 text-2xl font-bold">Dr. {user?.name}</h3>
            <p className="mb-6 text-sm text-gray-300">
              Leading healthcare expert passionate about patient success and telehealth excellence.
            </p>
            <ul className="space-y-3 text-sm text-gray-400">
              <InfoItem icon={<Clock size={20} />} label="Mon–Fri: 9 AM – 5 PM" />
              <InfoItem icon={<Phone size={20} />} label={user?.phone || '+1 555‑123‑4567'} />
              <InfoItem icon={<Mail size={20} />} label={user?.email || 'dr.john@medbook.com'} />
              <InfoItem icon={<MapPin size={20} />} label={user?.address || '123 Health St, Wellness City'} />
            </ul>
          </section>

          {/* Navigation */}
          <section>
            <h3 className="mb-4 text-xl font-semibold">Navigate</h3>
            <ul className="space-y-2">
              {['Dashboard', 'Appointments', 'Patients', 'Earnings', 'Settings'].map((label) => (
                <FooterLink key={label} to={`/doctor/${label.toLowerCase()}`}>
                  {label}
                </FooterLink>
              ))}
            </ul>
          </section>

          {/* Resources */}
          <section>
            <h3 className="mb-4 text-xl font-semibold">Resources</h3>
            <ul className="space-y-2">
              {[
                ['Help Center', '/doctor/help'],
                ['FAQs', '/doctor/faq'],
                ['Privacy Policy', '/privacy'],
                ['Terms of Service', '/terms'],
              ].map(([label, to]) => (
                <FooterLink key={label} to={to}>
                  {label}
                </FooterLink>
              ))}
            </ul>
          </section>

          {/* Social */}
          <section>
            <h3 className="mb-4 text-xl font-semibold">Connect</h3>
            <div className="flex space-x-4">
              <SocialLink href="https://facebook.com" icon={<Facebook size={18} />} />
              <SocialLink href="https://twitter.com" icon={<Twitter size={18} />} />
              <SocialLink href="https://instagram.com" icon={<Instagram size={18} />} />
              <SocialLink href="https://linkedin.com" icon={<Linkedin size={18} />} />
            </div>
          </section>
        </div>

        <div className="flex flex-col items-center justify-between pt-8 mt-16 text-sm text-gray-400 border-t border-gray-700 md:flex-row">
          <p>© {currentYear} MedBook. All rights reserved.</p>
          <div className="flex mt-4 space-x-6 md:mt-0">
            <Link to="/privacy" className="transition hover:text-green-300">
              Privacy
            </Link>
            <Link to="/terms" className="transition hover:text-green-300">
              Terms
            </Link>
            <Link to="/doctor/support" className="transition hover:text-green-300">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <motion.li
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4 }}
    className="flex items-center space-x-2 list-none"
  >
    <span className="text-green-300">{icon}</span>
    <span>{label}</span>
  </motion.li>
);

const FooterLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <motion.li whileHover={{ x: 5 }} className="list-none">
    <Link to={to} className="text-sm text-gray-400 transition hover:text-green-300">
      {children}
    </Link>
  </motion.li>
);

const SocialLink: React.FC<{ href: string; icon: React.ReactNode }> = ({ href, icon }) => (
  <motion.a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center justify-center w-10 h-10 text-white transition bg-gray-800 rounded-full shadow-xl hover:bg-green-500"
    whileHover={{ scale: 1.2, rotate: 15 }}
    whileTap={{ scale: 0.9 }}
  >
    {icon}
  </motion.a>
);
