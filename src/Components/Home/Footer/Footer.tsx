import React from 'react';
import logo from "../../../assets/Logo/logo.png";

import { 
  Instagram, 
  Facebook, 
  Twitter, 
  Youtube, 
  MapPin, 
  Phone, 
  Mail, 
  Mountain,
  Users,
  Award,
  Shield,
  Heart,
  Star,
  Send,
  ArrowUp,
  Flag
} from 'lucide-react';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gradient-to-br from-slate-200 to-gray-300 text-gray-800 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-400 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-pink-400 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="bg-white rounded-2xl p-1 shadow-lg transform">
                <img src={logo} alt="Infinity Trekkers" className="w-15 h-15" />
              </div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-[#0ea5e9] to-[#0369a1] bg-clip-text text-transparent">
                  Infinity Trekkers
                </h3>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Flag className="w-3 h-3" />
                  Made in India
                </p>
              </div>
            </div>
            
            <p className="text-gray-600 leading-relaxed">
              Creating unforgettable trekking experiences that connect you with nature's wonders and build lasting memories.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mb-2 mx-auto">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800">500+</p>
                <p className="text-xs text-gray-500">Happy Trekkers</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mb-2 mx-auto">
                  <Mountain className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800">50+</p>
                <p className="text-xs text-gray-500">Trek Routes</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-full mb-2 mx-auto">
                  <Award className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800">5★</p>
                <p className="text-xs text-gray-500">Rating</p>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex space-x-3">
              {[
                { icon: Instagram, color: 'from-pink-500 to-purple-500', label: 'Instagram' },
                { icon: Facebook, color: 'from-blue-600 to-blue-700', label: 'Facebook' },
                { icon: Twitter, color: 'from-sky-400 to-sky-500', label: 'Twitter' },
                { icon: Youtube, color: 'from-red-500 to-red-600', label: 'YouTube' }
              ].map(({ icon: Icon, color, label }, index) => (
                <a 
                  key={index}
                  href="#" 
                  className={`group relative p-3 bg-gradient-to-br ${color} rounded-xl text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300`}
                  aria-label={label}
                >
                  <Icon size={18} />
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Quick Links</h3>
            </div>
            <ul className="space-y-3">
              {[
                'Home',
                'Upcoming Treks',
                'Gallery',
                'About Us',
                'Contact'
              ].map((link, index) => (
                <li key={index}>
                  <a 
                    href="#" 
                    className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 hover:translate-x-1 transition-all duration-200 group"
                  >
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full group-hover:bg-blue-500 transition-colors"></div>
                    <span>{link}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Treks */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Popular Treks</h3>
            </div>
            <ul className="space-y-3">
              {[
                { name: 'Kalsubai Night Trek', rating: '4.9', link: 'https://forms.gle/vqbxY2QHg4ZbaLQx7' },
                { name: 'Harihar Fort Trek', rating: '4.8'  , link: 'https://forms.gle/FBWkJg97SkVXNuRx8'},
                { name: 'Aadrai Jungle Trek', rating: '4.7' , link: 'https://forms.gle/Fs1QAgy3DmBwdDSDA' },
                { name: 'Harishchandragad', rating: '4.9' , link: 'https://forms.gle/ytfGiASW3fHNd9ZQ8' },
                { name: 'Kalu Waterfall Trek', rating: '4.8'  , link: 'https://forms.gle/Wt2zxtndP2yYGhvA8'}
              ].map((trek, index) => (
                <li key={index}>
                  <a 
                    href= {trek.link}
                    className="flex items-center justify-between text-gray-600 hover:text-green-600 transition-colors group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform duration-200">{trek.name}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-xs font-medium">{trek.rating}</span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Phone className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Contact Us</h3>
            </div>
            <div className="space-y-4">
              {[
                { icon: MapPin, content: "123 Trekker's Path, Mountain View, Maharashtra, India", type: 'text' },
                { icon: Phone, content: "+91 98765 43210", type: 'tel', href: "tel:+919876543210" },
                { icon: Mail, content: "info@infinitytrekkers.com", type: 'email', href: "mailto:info@infinitytrekkers.com" }
              ].map(({ icon: Icon, content, type, href }, index) => (
                <div key={index} className="flex items-start space-x-3 group">
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Icon className="w-4 h-4 text-gray-600 group-hover:text-blue-600 transition-colors" />
                  </div>
                  {href ? (
                    <a href={href} className="text-gray-600 hover:text-blue-600 transition-colors leading-relaxed">
                      {content}
                    </a>
                  ) : (
                    <p className="text-gray-600 leading-relaxed">{content}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 mb-12 border border-blue-100">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Join Our Trekking Community</h3>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Subscribe to get updates on upcoming treks, special offers, and expert trekking tips delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="relative flex-grow">
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  className="w-full px-6 py-4 rounded-2xl bg-white text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                />
              </div>
              <button 
                onClick={() => console.log('Newsletter subscription clicked')}
                className="bg-gradient-to-r from-[#0ea5e9] to-[#0369a1]   hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Subscribe</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            
            {/* Copyright and Credits */}
            <div className="text-center lg:text-left">
              <p className="text-gray-600 text-sm mb-2">
                © {new Date().getFullYear()} Infinity Trekkers. All rights reserved.
              </p>
              <p className="text-gray-500 text-xs flex items-center justify-center lg:justify-start space-x-2">
                <Heart className="w-3 h-3 text-red-500" />
                <span>Developed by</span>
                <span className="font-semibold text-gray-700">Shantanu Kulkarni</span>
                <span>&</span>
                <span className="font-semibold text-gray-700">Vaishnavi Kothawade</span>
              </p>
            </div>

            {/* Links and Scroll to Top */}
            <div className="flex items-center space-x-6">
              <div className="flex space-x-4">
                {['Privacy Policy', 'Terms of Service', 'FAQ'].map((link, index) => (
                  <a key={index} href="#" className="text-gray-500 hover:text-blue-600 text-sm transition-colors">
                    {link}
                  </a>
                ))}
              </div>
              
              <button 
                onClick={scrollToTop}
                className="group bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-3 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                aria-label="Scroll to top"
              >
                <ArrowUp className="w-4 h-4 group-hover:animate-bounce" />
              </button>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center space-x-6 mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center space-x-2 text-gray-500">
              <Shield className="w-4 h-4" />
              <span className="text-xs">Secure Booking</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-500">
              <Award className="w-4 h-4" />
              <span className="text-xs">Certified Guides</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-500">
              <Heart className="w-4 h-4" />
              <span className="text-xs">24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;