import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, MessageCircle, Mountain, Compass, Facebook, Instagram, Twitter, Youtube, ChevronRight } from 'lucide-react';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    trekType: 'beginner'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Thank you for your message! Our adventure team will contact you soon.');
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      trekType: 'beginner'
    });
  };

  const contactCards = [
    {
      icon: <Phone className="w-6 h-6 text-blue-600" />,
      title: "Call Our Experts",
      details: ["+91 98765 43210", "+91 87654 32109"],
      description: "24/7 support for all your adventure queries",
      button: {
        text: "Call Now",
        icon: <ChevronRight className="w-4 h-4" />
      }
    },
    {
      icon: <Mail className="w-6 h-6 text-blue-600" />,
      title: "Email Us",
      details: ["hello@infinitytrekkers.com", "support@infinitytrekkers.com"],
      description: "Typically respond within 2 hours",
      button: {
        text: "Send Email",
        icon: <ChevronRight className="w-4 h-4" />
      }
    },
    {
      icon: <Compass className="w-6 h-6 text-blue-600" />,
      title: "Visit Our Basecamp",
      details: ["Adventure Hub, 2nd Floor", "MG Road, Bangalore - 560001"],
      description: "Meet our team for personalized trek planning",
      button: {
        text: "Get Directions",
        icon: <ChevronRight className="w-4 h-4" />
      }
    }
  ];

  const socialMedia = [
    { icon: <Facebook className="w-5 h-5" />, name: "Facebook", link: "#" },
    { icon: <Instagram className="w-5 h-5" />, name: "Instagram", link: "#" },
    { icon: <Twitter className="w-5 h-5" />, name: "Twitter", link: "#" },
    { icon: <Youtube className="w-5 h-5" />, name: "YouTube", link: "#" }
  ];

  const trekTypes = [
    {
      icon: <Mountain className="w-8 h-8 text-blue-600" />,
      title: "Beginner Treks",
      description: "Perfect for first-time adventurers with easy trails"
    },
    {
      icon: <Mountain className="w-8 h-8 text-blue-600" />,
      title: "Advanced Expeditions",
      description: "Challenging routes for experienced trekkers"
    },
    {
      icon: <Compass className="w-8 h-8 text-blue-600" />,
      title: "Custom Adventures",
      description: "Tailored treks designed just for your group"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Parallax Effect */}
      <div className="relative h-96 overflow-hidden bg-white ">
        <div className="absolute inset-0   "></div>
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/15389321/pexels-photo-15389321/free-photo-of-a-view-of-the-mountains-from-a-high-altitude.jpeg')] bg-cover bg-center opacity-180"></div>
        
        <div className="relative z-20 h-full flex flex-col justify-center px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <MessageCircle className="w-10 h-10 text-blue-300 mr-3" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">Start Your Adventure Today</h1>
            </div>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Our team of mountain experts is ready to help you plan your perfect trekking experience.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Options Section */}
      <div className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How Would You Like to Connect?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose your preferred way to reach our adventure specialists
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {contactCards.map((card, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-center w-14 h-14 bg-blue-50 rounded-full mb-6 mx-auto">
                  {card.icon}
                </div>
                <h3 className="text-xl font-bold text-center text-gray-800 mb-4">{card.title}</h3>
                <div className="space-y-3 mb-6">
                  {card.details.map((detail, idx) => (
                    <p key={idx} className="text-gray-600 text-center">{detail}</p>
                  ))}
                </div>
                <p className="text-sm text-gray-500 text-center italic mb-6">{card.description}</p>
                <button className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-300">
                  {card.button.text}
                  {card.button.icon}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Adventure Planning Section */}
      <div className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Form Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Plan Your Custom Trek</h2>
              <p className="text-gray-600 mb-8">Fill out this form and our adventure specialist will create a personalized trekking plan for you</p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Your Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Adventure Type *</label>
                  <select
                    name="trekType"
                    value={formData.trekType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="beginner">Beginner Friendly</option>
                    <option value="intermediate">Moderate Challenge</option>
                    <option value="advanced">Advanced Expedition</option>
                    <option value="custom">Custom Adventure</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Your Adventure Details *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell us about your dream trek - preferred location, dates, group size, and any special requirements..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Send Adventure Request
                </button>
              </form>
            </div>

            {/* Adventure Types */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Our Signature Treks</h2>
              <p className="text-gray-600 mb-8">Explore our curated selection of unforgettable mountain experiences</p>
              
              <div className="space-y-6">
                {trekTypes.map((trek, index) => (
                  <div key={index} className="flex items-start gap-4 p-6 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300">
                    <div className="flex-shrink-0 mt-1">
                      {trek.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">{trek.title}</h3>
                      <p className="text-gray-600">{trek.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Media */}
              <div className="mt-12">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Join Our Adventure Community</h3>
                <div className="flex flex-wrap gap-4">
                  {socialMedia.map((social, index) => (
                    <a
                      key={index}
                      href={social.link}
                      className="flex items-center px-5 py-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 hover:border-blue-500"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="mr-3">{social.icon}</span>
                      <span className="font-medium">{social.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Adventure Basecamp Section */}
      <div className="relative py-16 px-4 bg-white text-white">
  {/* Background Image with Opacity */}
  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-180"></div>
  {/* Dark Overlay */}
  <div className="absolute inset-0 bg-blue-900/70"></div>
  
  <div className="relative z-10 max-w-7xl mx-auto">
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <h2 className="text-3xl font-bold mb-6">Visit Our Adventure Basecamp</h2>
        <p className="text-lg text-blue-100 mb-8 max-w-lg">
          Our Bangalore headquarters is more than just an office - it's a hub for adventure planning, gear testing, and storytelling.
        </p>
        
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <MapPin className="w-6 h-6 text-blue-300 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold mb-2">Location</h3>
              <p className="text-blue-100">Adventure Hub, 2nd Floor</p>
              <p className="text-blue-100">MG Road, Bangalore - 560001</p>
              <p className="text-blue-100">Karnataka, India</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <Clock className="w-6 h-6 text-blue-300 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold mb-2">Visiting Hours</h3>
              <p className="text-blue-100">Monday - Friday: 9:00 AM - 7:00 PM</p>
              <p className="text-blue-100">Saturday: 9:00 AM - 5:00 PM</p>
              <p className="text-blue-100">Sunday: 10:00 AM - 4:00 PM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="h-96 bg-blue-800 rounded-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-blue-700/50 backdrop-blur-sm"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center z-10">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-blue-300" />
            <h3 className="text-xl font-bold mb-2">Our Basecamp Location</h3>
            <p className="text-blue-200">MG Road, Bangalore</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

      {/* Emergency Contact Section */}
      <div className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-white shadow-xl">
            <div className="flex items-center justify-center mb-6">
              <Phone className="w-12 h-12 text-blue-200 mr-4" />
              <h2 className="text-3xl font-bold">24/7 Adventure Support</h2>
            </div>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              For urgent assistance during your trek or any emergency situation
            </p>
            <div className="bg-white/20 rounded-lg p-6 max-w-md mx-auto backdrop-blur-sm border border-white/30">
              <p className="text-3xl font-bold mb-2">+91 98765 43210</p>
              <p className="text-blue-200">Available round the clock for emergencies</p>
            </div>
            <p className="text-sm mt-8 text-blue-200">
              This number is monitored by our mountain rescue team 24 hours a day
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactUs;