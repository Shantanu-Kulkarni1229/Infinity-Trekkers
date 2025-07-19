import logo from "../../../assets/Logo/logo.png";

import { 
  Instagram, 
  Facebook, 
 
  MapPin, 
  Phone, 
  Mail, 
  Mountain,
  Users,
  Award,
  Shield,
  Heart,
  Star,

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
              Discover nature’s wonders through unforgettable treks with us — with a strong commitment to safety, respect for the environment, and mindful adventure.
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
                <p className="text-2xl font-bold text-gray-800">4.8★</p>
                <p className="text-xs text-gray-500">Rating</p>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex space-x-3">
              {[
                { icon: Instagram, color: 'from-pink-500 to-purple-500', label: 'Instagram' , Links: 'https://www.instagram.com/infinity_trekkers_maharashtra/?hl=en'},
                { icon: Facebook, color: 'from-blue-600 to-blue-700', label: 'Facebook', Links: 'https://www.facebook.com/people/Infinity-Trekkers-India/100093506460400/' },
                
              ].map(({ icon: Icon, color, label, Links }, index) => (
                <a 
                  key={index}
                  href={Links}
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
                { name: 'Kalu Waterfall Trek', rating: '4.8'  , link: 'https://forms.gle/Wt2zxtndP2yYGhvA8'},
                { name: 'Harihar Fort Trek', rating: '4.9'  , link: 'https://forms.gle/FBWkJg97SkVXNuRx8'},
                { name: 'RAIGAD  Fort Trek', rating: '4.9'  , link: 'https://forms.gle/bHXRL9KquEXD6cvG8'},
                { name: 'Devkund  Waterfall Trek', rating: '4.8'  , link: 'https://forms.gle/bwoDrk5gh3TGmYsw6'}
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
                { icon: MapPin, content: "Cannought Garden, CIDCO Cannought, place, Chhatrapati Sambhajinagar, Maharashtra 431001", type: 'text' },
                { icon: Phone, content: "+91 7666869100", type: 'tel', href: "tel:+917666869100" },
                { icon: Phone, content: "+91 8265085025", type: 'tel', href: "tel:+9198265085025" },
                { icon: Mail, content: "infinitytrekkersindia@gmail.com", type: 'email', href: "mailto:infinitytrekkersindia@gmail.com" }
              ].map(({ icon: Icon, content, href }, index) => (
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
                <a href="https://www.linkedin.com/in/shantanu-kulkarni1229/" className="font-semibold text-gray-700 hover:text-blue-600 hover:underline">Shantanu Kulkarni</a>
                <span>&</span>
                <a href="https://www.linkedin.com/in/vaishnavi-kothawade-030627310//" className="font-semibold text-gray-700 hover:text-blue-600 hover:underline">Vaishnavi Kothawade</a>
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