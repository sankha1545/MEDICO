import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowRight } from 'lucide-react';
import { Button } from '../../components/common/Button';

const NotFoundPage = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8 text-primary-500">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Page Not Found</h1>
        <p className="text-xl text-gray-600 max-w-lg mx-auto mb-8">
          We're sorry, the page you requested could not be found. Please check the URL or navigate back to the homepage.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Button 
            as={Link} 
            to="/"
            variant="primary"
            size="lg"
            icon={<Home size={18} />}
          >
            Back to Home
          </Button>
          <Button 
            as={Link} 
            to="/contact"
            variant="outline"
            size="lg"
            iconPosition="right"
            icon={<ArrowRight size={18} />}
          >
            Contact Support
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;