// components/ScrollAnimation.jsx
import { motion } from 'framer-motion';

const ScrollAnimation = ({ children, className = '', direction = 'down', delay = 0 }) => {
  const generateVariants = (direction) => {
    const axis = direction === 'left' || direction === 'right' ? 'x' : 'y';
    const value = direction === 'right' || direction === 'down' ? 100 : -100;

    return {
      hidden: { filter: 'blur(10px)', opacity: 0, [axis]: value },
      visible: {
        filter: 'blur(0px)',
        opacity: 1,
        [axis]: 0,
        transition: { duration: 0.5, ease: 'easeOut', delay },
      },
    };
  };

  const variants = generateVariants(direction);

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      variants={variants}
      viewport={{ amount: 0.3, margin: '0px 0px -200px 0px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default ScrollAnimation;
