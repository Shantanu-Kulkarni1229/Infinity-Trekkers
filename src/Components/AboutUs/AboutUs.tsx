import { Award, Heart, Mountain, Users, ChevronRight, ArrowRight } from 'lucide-react';
import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const AboutUs = () => {
  // Animation controls
  const controls = useAnimation();
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: false
  });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    } else {
      controls.start('hidden');
    }
  }, [controls, inView]);

  const founders = [
    {
      name: "Rajesh Kumar",
      experience: "12 Years of Trekking Experience",
      role: "Co-Founder & Lead Guide",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
      comment: "Infinity Trekkers is more than just a community - it's a family that shares the passion for mountains and adventure. Every trek we organize is a journey towards discovering not just nature's beauty, but also our inner strength."
    },
    {
      name: "Priya Sharma",
      experience: "10 Years of Adventure Sports",
      role: "Co-Founder & Operations Head",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face",
      comment: "At Infinity Trekkers, we believe that mountains teach us life's most valuable lessons. Our mission is to make these experiences accessible to everyone, regardless of their background or experience level."
    }
  ];

  const volunteers = [
    {
      name: "Arjun Patel",
      experience: "8 Years Trekking",
      role: "Senior Trek Leader",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
      comment: "Infinity Trekkers has given me a platform to share my love for mountains with like-minded people. The sense of community and support here is unmatched."
    },
    {
      name: "Sneha Reddy",
      experience: "6 Years Adventure Guide",
      role: "Safety Coordinator",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face",
      comment: "Being part of Infinity Trekkers means being part of something bigger than yourself. We don't just trek together, we grow together as a community."
    },
    {
      name: "Vikram Singh",
      experience: "9 Years Mountain Climbing",
      role: "Technical Guide",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face",
      comment: "The spirit of Infinity Trekkers is what sets us apart. We're not just organizing treks, we're creating memories and friendships that last a lifetime."
    },
    {
      name: "Meera Joshi",
      experience: "7 Years Nature Photography",
      role: "Photography Mentor",
      image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=300&fit=crop&crop=face",
      comment: "Infinity Trekkers has taught me that every mountain has a story, and every trekker has a dream. We help turn those dreams into reality."
    },
    {
      name: "Rahul Gupta",
      experience: "5 Years Wilderness Training",
      role: "Survival Expert",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face",
      comment: "What I love about Infinity Trekkers is our commitment to safety and inclusivity. We ensure that everyone feels welcome and supported on their journey."
    },
    {
      name: "Ananya Desai",
      experience: "4 Years Environmental Activism",
      role: "Sustainability Lead",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face",
      comment: "We trek with purpose - to explore, to learn, and to protect. Infinity Trekkers is at the forefront of sustainable adventure tourism."
    }
  ];

  const stats = [
    { value: "500+", label: "Active Members", icon: Users },
    { value: "100+", label: "Treks Organized", icon: Mountain },
    { value: "50+", label: "Destinations", icon: Award },
    { value: "5", label: "Years of Excellence", icon: Heart }
  ];

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-white" ref={ref}>
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden bg-gradient-to-br from-emerald-900 to-teal-800 text-white py-24"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-8">
              <Mountain className="w-12 h-12 mr-4 text-emerald-300" />
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                Infinity Trekkers <span className="text-emerald-300">India</span>
              </h1>
            </div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl md:text-2xl font-light max-w-3xl mx-auto text-emerald-100"
            >
              Where Every Step Leads to Infinite Possibilities
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-12"
            >
              <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group">
                <span className="font-medium mr-2">Explore Our Story</span>
                <ChevronRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* About Community Section */}
      <motion.section 
        initial="hidden"
        animate={controls}
        variants={staggerContainer}
        className="py-24 px-6 max-w-7xl mx-auto"
      >
        <motion.div variants={fadeIn} className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Our <span className="text-emerald-600">Journey</span>
          </h2>
          <div className="w-32 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto mb-8 rounded-full"></div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            From humble beginnings to becoming India's most trusted trekking community
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div variants={fadeIn} className="space-y-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              Founded in 2018, <span className="font-semibold text-emerald-600">Infinity Trekkers India</span> began as a small group of friends who shared an insatiable passion for the mountains. What started as weekend excursions soon evolved into a movement that has touched thousands of lives across the country.
            </p>
            
            <p className="text-lg text-gray-700 leading-relaxed">
              Our philosophy is simple: <span className="font-semibold">the mountains are for everyone</span>. We break down barriers by offering treks at all difficulty levels, comprehensive training programs, and financial assistance for those who need it. Our community thrives on diversity - from college students to corporate professionals, from first-timers to seasoned mountaineers.
            </p>
            
            <div className="mt-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Our Mission</h4>
                  <p className="text-gray-600 mt-1">
                    To make mountain experiences accessible, safe, and transformative for all Indians regardless of background or experience level.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 mt-6">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Our Vision</h4>
                  <p className="text-gray-600 mt-1">
                    To create India's most inclusive outdoor community that fosters personal growth, environmental stewardship, and lifelong friendships.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            variants={fadeIn}
            className="grid grid-cols-2 gap-6"
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index}
                variants={fadeIn}
                whileHover={{ y: -5 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center">
                  <stat.icon className="w-10 h-10 text-emerald-600 mb-4" />
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Values Section */}
      <motion.section 
        initial="hidden"
        animate={controls}
        variants={staggerContainer}
        className="py-24 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.div variants={fadeIn} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our <span className="text-emerald-600">Core Values</span>
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto mb-8 rounded-full"></div>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              The principles that guide every step we take
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              variants={fadeIn}
              whileHover={{ scale: 1.03 }}
              className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
            >
              <div className="w-14 h-14 bg-emerald-50 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Inclusivity</h3>
              <p className="text-gray-600">
                We believe the mountains don't discriminate, and neither should we. Our community welcomes people of all backgrounds, ages, and experience levels.
              </p>
            </motion.div>
            
            <motion.div 
              variants={fadeIn}
              whileHover={{ scale: 1.03 }}
              className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
            >
              <div className="w-14 h-14 bg-emerald-50 rounded-lg flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Safety First</h3>
              <p className="text-gray-600">
                Every trek is meticulously planned with certified guides, proper equipment, and emergency protocols. Your safety is our top priority.
              </p>
            </motion.div>
            
            <motion.div 
              variants={fadeIn}
              whileHover={{ scale: 1.03 }}
              className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
            >
              <div className="w-14 h-14 bg-emerald-50 rounded-lg flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Sustainable Trekking</h3>
              <p className="text-gray-600">
                We follow Leave No Trace principles, support local communities, and actively participate in conservation efforts to protect our trails.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Founders Section */}
      <motion.section 
        initial="hidden"
        animate={controls}
        variants={staggerContainer}
        className="py-24 px-6 max-w-7xl mx-auto"
      >
        <motion.div variants={fadeIn} className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Meet The <span className="text-emerald-600">Visionaries</span>
          </h2>
          <div className="w-32 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto mb-8 rounded-full"></div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            The passionate leaders who turned their love for mountains into a movement
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 gap-12">
          {founders.map((founder, index) => (
            <motion.div 
              key={index}
              variants={fadeIn}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
            >
              <div className="relative h-72 bg-gradient-to-br from-emerald-900 to-teal-800 flex items-center justify-center">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
                <img 
                  src={founder.image} 
                  alt={founder.name}
                  className="relative z-10 w-40 h-40 rounded-full object-cover border-4 border-white shadow-xl"
                />
              </div>
              <div className="p-8">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">{founder.name}</h3>
                  <p className="text-emerald-600 font-medium">{founder.role}</p>
                  <p className="text-gray-500 text-sm mt-1">{founder.experience}</p>
                </div>
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                  <p className="text-gray-700 italic leading-relaxed">
                    "{founder.comment}"
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Volunteers Section */}
      <motion.section 
        initial="hidden"
        animate={controls}
        variants={staggerContainer}
        className="py-24 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.div variants={fadeIn} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our <span className="text-emerald-600">Dream Team</span>
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto mb-8 rounded-full"></div>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              The passionate individuals who make every trek an unforgettable experience
            </p>
          </motion.div>
          
          <motion.div 
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {volunteers.map((volunteer, index) => (
              <motion.div 
                key={index}
                variants={fadeIn}
                whileHover={{ y: -10 }}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="relative h-56 bg-gradient-to-br from-emerald-900 to-teal-800 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
                  <img 
                    src={volunteer.image} 
                    alt={volunteer.name}
                    className="relative z-10 w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">{volunteer.name}</h3>
                  <p className="text-emerald-600 font-medium text-sm mt-1">{volunteer.role}</p>
                  <p className="text-gray-500 text-xs mb-4">{volunteer.experience}</p>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p className="text-gray-700 text-sm italic leading-relaxed">
                      "{volunteer.comment}"
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Call to Action */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="relative overflow-hidden bg-gradient-to-br from-emerald-900 to-teal-800 text-white py-24"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center px-6 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Ready to Begin Your <span className="text-emerald-300">Adventure</span>?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-emerald-100">
            Join our community of passionate trekkers and discover the infinite possibilities that await you in the mountains.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-emerald-800 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 flex items-center justify-center"
            >
              <span>Join Our Community</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-emerald-800 transition-all duration-300 flex items-center justify-center"
            >
              <span>View Upcoming Treks</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </motion.button>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default AboutUs;