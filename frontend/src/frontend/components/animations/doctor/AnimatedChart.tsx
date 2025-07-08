import React from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  AreaChart
} from 'recharts';

interface AnimatedChartProps {
  data: any[];
  title: string;
  dataKey: string;
  xAxisKey: string;
  color: string;
  delay: number;
  type?: 'line' | 'area';
}

const AnimatedChart: React.FC<AnimatedChartProps> = ({
  data,
  title,
  dataKey,
  xAxisKey,
  color,
  delay,
  type = 'line'
}) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl"
        >
          <p className="text-white font-medium">{label}</p>
          <p className={`text-${color}-400 font-bold`}>
            {`${payload[0].name}: ${payload[0].value}`}
          </p>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ 
        duration: 0.8, 
        delay,
        type: "spring",
        stiffness: 80
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.3 }
      }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 rounded-3xl blur-xl" />
      <div className="relative bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-5">
          <motion.div
            className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{ transform: 'translate(50%, -50%)' }}
          />
        </div>
        
        <motion.h3 
          className="text-2xl font-bold text-white mb-6 relative z-10"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay + 0.2 }}
        >
          {title}
        </motion.h3>
        
        <div className="relative z-10 h-64">
          <ResponsiveContainer width="100%" height="100%">
            {type === 'area' ? (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={`var(--${color}-400)`} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={`var(--${color}-400)`} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                <XAxis 
                  dataKey={xAxisKey} 
                  stroke="rgba(255,255,255,0.6)" 
                  fontSize={12}
                />
                <YAxis 
                  allowDecimals={false} 
                  stroke="rgba(255,255,255,0.6)" 
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  stroke={`var(--${color}-400)`}
                  strokeWidth={3}
                  fill={`url(#gradient-${color})`}
                  isAnimationActive={true}
                  animationDuration={2000}
                  animationBegin={delay * 1000}
                />
              </AreaChart>
            ) : (
              <LineChart data={data}>
                <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                <XAxis 
                  dataKey={xAxisKey} 
                  stroke="rgba(255,255,255,0.6)" 
                  fontSize={12}
                />
                <YAxis 
                  allowDecimals={false} 
                  stroke="rgba(255,255,255,0.6)" 
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke={`var(--${color}-400)`}
                  strokeWidth={4}
                  dot={{ 
                    fill: `var(--${color}-400)`, 
                    strokeWidth: 2, 
                    r: 6,
                    stroke: 'white'
                  }}
                  activeDot={{ 
                    r: 8, 
                    stroke: `var(--${color}-400)`,
                    strokeWidth: 3,
                    fill: 'white'
                  }}
                  isAnimationActive={true}
                  animationDuration={2000}
                  animationBegin={delay * 1000}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Floating elements */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-2 h-2 bg-${color}-400 rounded-full opacity-30`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-20, 20, -20],
                x: [-10, 10, -10],
                opacity: [0.1, 0.6, 0.1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default AnimatedChart;