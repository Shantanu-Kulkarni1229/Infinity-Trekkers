import React, { useState, useEffect, useRef } from 'react';
import testimonialsData from '../../../Data/Testomonial.json';
import { Pause, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Testimonial {
    id: number;
    name: string;
    trek: string;
    rating: number;
    feedback: string;
    location: string;
    difficulty: string;
    duration: string;
    groupSize: number;
    season: string;
    highlights: string[];
    avatar: string;
    trekDate: string;
    verified: boolean;
}

const Testimonials: React.FC = () => {
    const [filteredTestimonials, setFilteredTestimonials] = useState(testimonialsData);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
    const [selectedSeason, setSelectedSeason] = useState<string>('all');
    const [isPaused, setIsPaused] = useState(false);
    const [expandedFeedback, setExpandedFeedback] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollSpeed = 1;
    const [isDifficultyOpen, setIsDifficultyOpen] = useState(false);
    const [isSeasonOpen, setIsSeasonOpen] = useState(false);
    // Filter testimonials
    useEffect(() => {
        let filtered = testimonialsData;

        if (selectedDifficulty !== 'all') {
            filtered = filtered.filter(t => t.difficulty.toLowerCase() === selectedDifficulty);
        }

        if (selectedSeason !== 'all') {
            filtered = filtered.filter(t => t.season.toLowerCase() === selectedSeason);
        }

        setFilteredTestimonials(filtered);
    }, [selectedDifficulty, selectedSeason]);

    // Infinite scrolling animation
    useEffect(() => {
        let animationId: number;
        let lastTimestamp: number;
        const container = containerRef.current;

        const animate = (timestamp: number) => {
            if (!lastTimestamp) lastTimestamp = timestamp;
            const delta = timestamp - lastTimestamp;
            lastTimestamp = timestamp;

            if (container && !isPaused) {
                container.scrollLeft += scrollSpeed * (delta / 16);

                if (container.scrollLeft >= container.scrollWidth / 2) {
                    container.scrollLeft = 0;
                }
            }
            animationId = requestAnimationFrame(animate);
        };

        animationId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationId);
    }, [isPaused, filteredTestimonials]);

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'easy': return 'bg-blue-100 text-blue-800';
            case 'moderate': return 'bg-yellow-100 text-yellow-800';
            case 'hard': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getSeasonIcon = (season: string) => {
        switch (season.toLowerCase()) {
            case 'winter': return '❄️';
            case 'monsoon': return '🌧️';
            case 'summer': return '☀️';
            default: return '🌤️';
        }
    };

    const toggleFeedbackExpansion = (id: number) => {
        setExpandedFeedback(expandedFeedback === id ? null : id);
    };

    const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => {
        const isExpanded = expandedFeedback === testimonial.id;
        const feedbackExceedsLimit = testimonial.feedback.length > 150;

        return (
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 p-6 border border-gray-100 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <img
                                src={testimonial.avatar}
                                alt={testimonial.name}
                                className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-200"
                            />
                            {testimonial.verified && (
                                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 text-lg">{testimonial.name}</h3>
                            <p className="text-sm text-gray-500 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {testimonial.location}
                            </p>
                        </div>
                    </div>
                    <span className="text-sm text-gray-400">{testimonial.trekDate}</span>
                </div>

                {/* Trek Info */}
                <div className="mb-4">
                    <h4 className="font-bold text-blue-700 text-lg mb-2">{testimonial.trek}</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(testimonial.difficulty)}`}>
                            {testimonial.difficulty}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getSeasonIcon(testimonial.season)} {testimonial.season}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            ⏱️ {testimonial.duration}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            👥 {testimonial.groupSize}
                        </span>
                    </div>
                </div>

                {/* Rating */}
                <div className="flex items-center mb-4">
                    <div className="flex mr-2">
                        {[...Array(5)].map((_, i) => (
                            <svg
                                key={i}
                                className={`w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        ))}
                    </div>
                    <span className="text-sm text-gray-600 font-medium">{testimonial.rating}/5</span>
                </div>

                {/* Feedback with Read More */}
                <blockquote className={`text-gray-700 italic mb-4 leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
                    "{testimonial.feedback}"
                </blockquote>

                {feedbackExceedsLimit && (
                    <button
                        onClick={() => toggleFeedbackExpansion(testimonial.id)}
                        className="text-blue-600 text-sm font-medium mb-4 self-start hover:underline"
                    >
                        {isExpanded ? 'Read Less' : 'Read More'}
                    </button>
                )}

                {/* Highlights */}
                <div className="border-t pt-4 mt-auto">
                    <p className="text-sm font-medium text-gray-600 mb-2">Highlights:</p>
                    <div className="flex flex-wrap gap-1">
                        {testimonial.highlights.map((highlight, index) => (
                            <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {highlight}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <section className="py-16 bg-gradient-to-br from-slate-50 via-blue-50 to-blue-50 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Adventure Stories from Fellow Trekkers
                    </h2>
                    <p className="text-gray-600 max-w-3xl mx-auto text-lg">
                        Discover authentic experiences from our community of adventure enthusiasts.
                        Their stories might inspire your next great adventure!
                    </p>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row justify-center items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="flex space-x-4">

                        {/* Difficulty Filter */}
                        <div className="relative w-40">
                            <select
                                value={selectedDifficulty}
                                onChange={(e) => setSelectedDifficulty(e.target.value)}
                                onFocus={() => setIsDifficultyOpen(true)}
                                onBlur={() => setIsDifficultyOpen(false)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none pr-8"
                            >
                                <option value="all">All Difficulties</option>
                                <option value="easy">Easy</option>
                                <option value="moderate">Moderate</option>
                                <option value="hard">Hard</option>
                            </select>
                            <div className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                {isDifficultyOpen ? '▲' : '▼'}
                            </div>
                        </div>

                        {/* Season Filter */}
                        <div className="relative w-40">
                            <select
                                value={selectedSeason}
                                onChange={(e) => setSelectedSeason(e.target.value)}
                                onFocus={() => setIsSeasonOpen(true)}
                                onBlur={() => setIsSeasonOpen(false)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none pr-8"
                            >
                                <option value="all">All Seasons</option>
                                <option value="winter">Winter</option>
                                <option value="monsoon">Monsoon</option>
                                <option value="summer">Summer</option>
                            </select>
                            <div className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                {isSeasonOpen ? '▲' : '▼'}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-lg p-4 text-center shadow-sm border">
                        <div className="text-2xl font-bold text-blue-600">{filteredTestimonials.length}</div>
                        <div className="text-sm text-gray-600">Reviews</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center shadow-sm border">
                        <div className="text-2xl font-bold text-yellow-500">
                            {(filteredTestimonials.reduce((acc, t) => acc + t.rating, 0) / filteredTestimonials.length).toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-600">Avg Rating</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center shadow-sm border">
                        <div className="text-2xl font-bold text-blue-600">
                            {filteredTestimonials.filter(t => t.verified).length}
                        </div>
                        <div className="text-sm text-gray-600">Verified</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center shadow-sm border">
                        <div className="text-2xl font-bold text-purple-600">
                            {new Set(filteredTestimonials.map(t => t.location)).size}
                        </div>
                        <div className="text-sm text-gray-600">Locations</div>
                    </div>
                </div>

                {/* Testimonials Infinite Scroll */}
                <div className="relative overflow-hidden">
                    <div
                        ref={containerRef}
                        className="flex overflow-x-auto py-0 gap-6"
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                        style={{
                            scrollBehavior: 'auto',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none'
                        }}
                    >
                        <style>{`div::-webkit-scrollbar { display: none; }`}</style>

                        {[...filteredTestimonials, ...filteredTestimonials].map((testimonial, index) => (
                            <div
                                key={`${testimonial.id}-${index}`}
                                className="flex-shrink-0 w-80"
                            >
                                <TestimonialCard testimonial={testimonial} />
                            </div>
                        ))}
                    </div>

                    <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-50 via-blue-50 to-transparent pointer-events-none z-10"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-blue-50 via-blue-50 to-transparent pointer-events-none z-10"></div>

                    {/* Compact scroll indicator */}
                    <div className="text-center mt-2">
                        <p className="text-xs text-gray-500 flex items-center justify-center">
                            <button
                                onClick={() => setIsPaused(!isPaused)}
                                className="mr-2 text-gray-500 hover:text-gray-700"
                            >
                                {isPaused ? <Play size={16} /> : <Pause size={16} />}
                            </button>
                            Hover to pause • Auto-scrolling
                        </p>
                    </div>
                </div>

                {/* Call to Action */}
                <div className="mt-16 text-center bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
                    <h3 className="text-2xl font-bold mb-4">Ready for Your Adventure?</h3>
                    <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                        Join thousands of trekkers who have discovered the magic of the mountains with us.
                        Your story could be next!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/upcoming-trek"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
                        >
                            Browse Treks
                        </Link>

                        <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300 transform hover:scale-105">
                            Share Your Story
                        </button>
                    </div>
                </div>

                {/* Trust Indicators */}
                <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    <div className="flex flex-col items-center">
                        <div className="bg-blue-100 rounded-full p-4 mb-3">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h4 className="font-semibold text-gray-900">Verified Reviews</h4>
                        <p className="text-sm text-gray-600">100% authentic experiences</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="bg-blue-100 rounded-full p-4 mb-3">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h4 className="font-semibold text-gray-900">Expert Guides</h4>
                        <p className="text-sm text-gray-600">Professional & knowledgeable</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="bg-yellow-100 rounded-full p-4 mb-3">
                            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h4 className="font-semibold text-gray-900">Safety First</h4>
                        <p className="text-sm text-gray-600">Your safety is our priority</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="bg-purple-100 rounded-full p-4 mb-3">
                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <h4 className="font-semibold text-gray-900">Memorable Experiences</h4>
                        <p className="text-sm text-gray-600">Adventures you'll never forget</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Testimonials;