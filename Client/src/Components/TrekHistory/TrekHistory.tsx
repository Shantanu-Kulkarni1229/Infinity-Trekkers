// import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
// import { ChevronDown, MapPin, Mountain, Zap, Calendar, CheckCircle, Search, Star, Clock, Users, TreePine, Camera, Navigation, ArrowLeft, Grid, List } from 'lucide-react';

// // Import your trek data
// import trekData from '../../Data/TrekHistory.json';

// interface TrekHistory {
//   id: number;
//   name: string;
//   location: string;
//   height_ft?: number;
//   height_m?: number;
//   difficulty: string;
//    rating?: number;
//   duration?: string;
//   group_size?: string;
//   history: {
//     era?: string;
//     dynasties?: string[];
//     significance?: string;
//     legends?: string;
//     archaeology?: string[];
//     origin?: string;
//     strategic_use?: string;
//     cultural_practice?: string;
//     etymology?: string;
//     historical_use?: {
//       tribal?: string;
//       military?: string;
//       colonial?: string;
//     };
//     ecological_significance?: string;
//     discovery?: string;
//     mythology?: string;
//     freedom_struggle?: string;
//     geology?: string;
//     construction?: string;
//     engineering?: string;
//     historical_events?: string[];
//     name_origin?: string;
//     ecological_history?: string;
//     military_use?: string;
//     unique_feature?: string;
//     sacred_geography?: string;
//     colonial_era?: string;
//     recent_history?: string;
//     spiritual_heritage?: {
//       amruteshwar_temple?: string;
//       agastya_rishi?: string;
//     };
//     colonial_engineering?: {
//       wilson_dam?: string;
//       arthur_lake?: string;
//     };
//   };
//   best_time: string[];
//   highlights: string[];
//   starting_points: string[];
//   nearest_station: string[];
//   map_link: string;
//   activities?: string[];
//   image?: string;
// }

// const TrekHistory = () => {
//   const [selectedTrek, setSelectedTrek] = useState<TrekHistory | null>(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [difficultyFilter, setDifficultyFilter] = useState('all');
//   const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
//   const [isLoading, setIsLoading] = useState(false);
//   const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

//   const containerRef = useRef<HTMLDivElement>(null);
//   const searchRef = useRef<HTMLInputElement>(null);

//   // Memoized filtered and sorted treks
//   const filteredTreks = useMemo(() => {
//     // Ensure all required array fields are present
//     const normalizedTreks = trekData.map((trek) => ({
//       ...trek,
//       best_time: trek.best_time ?? [],
//       highlights: trek.highlights ?? [],
//       starting_points: trek.starting_points ?? [],
//       nearest_station: trek.nearest_station ?? [],
//     }));
//     return normalizedTreks.filter((trek) => {
//       const matchesSearch = trek.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         trek.location.toLowerCase().includes(searchTerm.toLowerCase());
//       const matchesDifficulty = difficultyFilter === 'all' ||
//         trek.difficulty.toLowerCase() === difficultyFilter.toLowerCase();
//       return matchesSearch && matchesDifficulty;
//     });
//   }, [searchTerm, difficultyFilter]);

//   // Keyboard navigation
//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (e.key === 'Escape' && selectedTrek) {
//         setSelectedTrek(null);
//       }
//       if (e.key === '/' && !selectedTrek) {
//         e.preventDefault();
//         searchRef.current?.focus();
//       }
//     };

//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [selectedTrek]);

//   // Smooth animations
//   const handleTrekSelect = useCallback(async (trek: TrekHistory) => {
//     setIsLoading(true);

//     // Simulate loading for smooth transition
//     await new Promise(resolve => setTimeout(resolve, 300));

//     setSelectedTrek(trek);
//     setIsLoading(false);

//     // Scroll to top smoothly
//     containerRef.current?.scrollTo({
//       top: 0,
//       behavior: 'smooth'
//     });
//   }, []);

//   const toggleSection = useCallback((section: string) => {
//     setExpandedSections(prev => ({
//       ...prev,
//       [section]: !prev[section]
//     }));
//   }, []);

//   const getDifficultyColor = (difficulty: string) => {
//     switch (difficulty.toLowerCase()) {
//       case 'easy': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
//       case 'moderate': return 'bg-amber-50 text-amber-700 border-amber-200';
//       case 'difficult': return 'bg-rose-50 text-rose-700 border-rose-200';
//       default: return 'bg-gray-50 text-gray-700 border-gray-200';
//     }
//   };

//   const renderHistorySection = (title: string, content: string | string[] | Record<string, string>, icon: React.ReactNode) => {
//     if (!content) return null;

//     const sectionKey = title.toLowerCase().replace(/\s+/g, '-');
//     const isExpanded = expandedSections[sectionKey];

//     return (
//       <div className="mb-6 border border-gray-100 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all">
//         <button
//           onClick={() => toggleSection(sectionKey)}
//           className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
//         >
//           <div className="flex items-center space-x-3">
//             <div className="text-indigo-500">{icon}</div>
//             <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
//           </div>
//           <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
//         </button>

//         {isExpanded && (
//           <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
//             {Array.isArray(content) ? (
//               <ul className="space-y-2">
//                 {content.map((item, index) => (
//                   <li key={index} className="flex items-start space-x-2">
//                     <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
//                     <span className="text-gray-700">{item}</span>
//                   </li>
//                 ))}
//               </ul>
//             ) : typeof content === 'object' ? (
//               <div className="space-y-4">
//                 {Object.entries(content).map(([key, value]) => (
//                   <div key={key} className="border-l-2 border-indigo-200 pl-4">
//                     <h4 className="font-medium text-gray-800 capitalize mb-1">
//                       {key.replace(/_/g, ' ')}
//                     </h4>
//                     {typeof value === 'string' ? (
//                       <p className="text-gray-600">{value}</p>
//                     ) : Array.isArray(value) ? (
//                       <ul className="space-y-1">
//                         {value.map((item, i) => (
//                           <li key={i} className="text-gray-600">• {item}</li>
//                         ))}
//                       </ul>
//                     ) : (
//                       <div className="space-y-2">
//                         {Object.entries(value as Record<string, unknown>).map(([subKey, subValue]) => (
//                           <div key={subKey} className="ml-4">
//                             <h5 className="font-medium text-gray-700 capitalize">
//                               {subKey.replace(/_/g, ' ')}
//                             </h5>
//                             {typeof subValue === 'string' || typeof subValue === 'number' ? (
//                               <p className="text-gray-600">{subValue}</p>
//                             ) : (
//                               <p className="text-gray-600">Unsupported value type</p>
//                             )}
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <p className="text-gray-700 leading-relaxed">{content}</p>
//             )}
//           </div>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="container mx-auto px-4 py-8 max-w-7xl" ref={containerRef}>
//         {/* Header */}
//         <div className="text-center mb-12">
//           <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
//             <span className="bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
//               Trekking Through History
//             </span>
//           </h1>
//           <p className="text-lg text-gray-600 max-w-2xl mx-auto">
//             Discover the rich heritage and stories behind India's most iconic trekking destinations
//           </p>
//         </div>

//         {selectedTrek ? (
//           /* Trek Details View */
//           <div className="space-y-8">
//             {/* Back Button */}
//             <button
//               onClick={() => setSelectedTrek(null)}
//               className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-gray-700"
//             >
//               <ArrowLeft className="w-4 h-4" />
//               <span>Back to Treks</span>
//             </button>

//             {/* Trek Header */}
//             <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
//               <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 p-8 text-white">
//                 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
//                   <div className="flex-1">
//                     <h1 className="text-3xl md:text-4xl font-bold mb-2">{selectedTrek.name}</h1>
//                     <div className="flex flex-wrap gap-4 text-indigo-100">
//                       <div className="flex items-center space-x-1">
//                         <MapPin className="w-4 h-4" />
//                         <span>{selectedTrek.location}</span>
//                       </div>
//                       {selectedTrek.height_ft && (
//                         <div className="flex items-center space-x-1">
//                           <Mountain className="w-4 h-4" />
//                           <span>{selectedTrek.height_ft} ft ({selectedTrek.height_m} m)</span>
//                         </div>
//                       )}
//                       <div className="flex items-center space-x-1">
//                         <Zap className="w-4 h-4" />
//                         <span>{selectedTrek.difficulty}</span>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="mt-4 lg:mt-0 flex flex-wrap gap-3">
//                     {selectedTrek.rating && (
//                       <div className="flex items-center space-x-1 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
//                         <Star className="w-4 h-4 text-amber-300 fill-current" />
//                         <span>{selectedTrek.rating}</span>
//                       </div>
//                     )}
//                     {selectedTrek.duration && (
//                       <div className="flex items-center space-x-1 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
//                         <Clock className="w-4 h-4" />
//                         <span>{selectedTrek.duration}</span>
//                       </div>
//                     )}
//                     {selectedTrek.group_size && (
//                       <div className="flex items-center space-x-1 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
//                         <Users className="w-4 h-4" />
//                         <span>{selectedTrek.group_size}</span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Quick Info Cards */}
//               <div className="p-8 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
//                   <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
//                     <Calendar className="w-5 h-5 mr-2 text-indigo-500" />
//                     Best Time to Visit
//                   </h3>
//                   <ul className="space-y-2">
//                     {selectedTrek.best_time.map((time, index) => (
//                       <li key={index} className="flex items-center space-x-2">
//                         <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
//                         <span className="text-gray-700">{time}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>

//                 <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
//                   <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
//                     <Camera className="w-5 h-5 mr-2 text-indigo-500" />
//                     Trek Highlights
//                   </h3>
//                   <ul className="space-y-2">
//                     {selectedTrek.highlights.slice(0, 4).map((highlight, index) => (
//                       <li key={index} className="flex items-center space-x-2">
//                         <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
//                         <span className="text-gray-700">{highlight}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               </div>
//             </div>

//             {/* Historical Sections */}
//             <div className="space-y-6">
//               <h2 className="text-2xl font-bold text-gray-900 mb-6">Historical Significance</h2>

//               {selectedTrek.history.era && renderHistorySection(
//                 'Historical Era',
//                 selectedTrek.history.era,
//                 <Clock className="w-5 h-5" />
//               )}

//               {selectedTrek.history.dynasties && renderHistorySection(
//                 'Dynasties',
//                 selectedTrek.history.dynasties,
//                 <Users className="w-5 h-5" />
//               )}

//               {selectedTrek.history.significance && renderHistorySection(
//                 'Historical Significance',
//                 selectedTrek.history.significance,
//                 <Star className="w-5 h-5" />
//               )}

//               {selectedTrek.history.construction && renderHistorySection(
//                 'Construction',
//                 selectedTrek.history.construction,
//                 <Mountain className="w-5 h-5" />
//               )}

//               {selectedTrek.history.engineering && renderHistorySection(
//                 'Engineering Marvel',
//                 selectedTrek.history.engineering,
//                 <Zap className="w-5 h-5" />
//               )}

//               {selectedTrek.history.historical_events && renderHistorySection(
//                 'Key Historical Events',
//                 selectedTrek.history.historical_events,
//                 <Calendar className="w-5 h-5" />
//               )}

//               {selectedTrek.history.strategic_use && renderHistorySection(
//                 'Strategic Importance',
//                 selectedTrek.history.strategic_use,
//                 <Navigation className="w-5 h-5" />
//               )}

//               {selectedTrek.history.legends && renderHistorySection(
//                 'Legends & Mythology',
//                 selectedTrek.history.legends,
//                 <Star className="w-5 h-5" />
//               )}

//               {selectedTrek.history.mythology && renderHistorySection(
//                 'Mythological Connections',
//                 selectedTrek.history.mythology,
//                 <Star className="w-5 h-5" />
//               )}

//               {selectedTrek.history.archaeology && renderHistorySection(
//                 'Archaeological Features',
//                 selectedTrek.history.archaeology,
//                 <Mountain className="w-5 h-5" />
//               )}

//               {selectedTrek.history.ecological_significance && renderHistorySection(
//                 'Ecological Significance',
//                 selectedTrek.history.ecological_significance,
//                 <TreePine className="w-5 h-5" />
//               )}

//               {selectedTrek.history.spiritual_heritage && renderHistorySection(
//                 'Spiritual Heritage',
//                 selectedTrek.history.spiritual_heritage,
//                 <Star className="w-5 h-5" />
//               )}

//               {selectedTrek.history.colonial_engineering && renderHistorySection(
//                 'Colonial Engineering',
//                 selectedTrek.history.colonial_engineering,
//                 <Zap className="w-5 h-5" />
//               )}
//             </div>

//             {/* Action Buttons */}
//             <div className="flex flex-wrap gap-4 justify-center pt-8">
//               <a
//                 href={selectedTrek.map_link}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
//               >
//                 <MapPin className="w-5 h-5" />
//                 <span>View on Google Maps</span>
//               </a>

//               <button
//                 onClick={() => setSelectedTrek(null)}
//                 className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-lg"
//               >
//                 <ArrowLeft className="w-5 h-5" />
//                 <span>Explore More Treks</span>
//               </button>
//             </div>
//           </div>
//         ) : (
//           /* Trek Selection View */
//           <div className="space-y-8">
//             {/* Search and Filters */}
//             <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
//               <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
//                 <div className="flex-1 w-full lg:max-w-md">
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Search Treks
//                   </label>
//                   <div className="relative">
//                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//                     <input
//                       ref={searchRef}
//                       type="text"
//                       placeholder="Search by name or location..."
//                       className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-700"
//                       value={searchTerm}
//                       onChange={(e) => setSearchTerm(e.target.value)}
//                     />
//                   </div>
//                 </div>

//                 <div className="flex flex-col sm:flex-row gap-4 items-center">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Difficulty
//                     </label>
//                     <select
//                       className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
//                       value={difficultyFilter}
//                       onChange={(e) => setDifficultyFilter(e.target.value)}
//                     >
//                       <option value="all">All Difficulties</option>
//                       <option value="easy">Easy</option>
//                       <option value="moderate">Moderate</option>
//                       <option value="difficult">Difficult</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       View
//                     </label>
//                     <div className="flex bg-gray-100 rounded-lg p-1">
//                       <button
//                         onClick={() => setViewMode('grid')}
//                         className={`p-2 rounded-md transition-colors ${viewMode === 'grid'
//                           ? 'bg-white shadow-sm text-indigo-600'
//                           : 'text-gray-600 hover:text-gray-900'
//                           }`}
//                       >
//                         <Grid className="w-4 h-4" />
//                       </button>
//                       <button
//                         onClick={() => setViewMode('list')}
//                         className={`p-2 rounded-md transition-colors ${viewMode === 'list'
//                           ? 'bg-white shadow-sm text-indigo-600'
//                           : 'text-gray-600 hover:text-gray-900'
//                           }`}
//                       >
//                         <List className="w-4 h-4" />
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Results */}
//             <div className="space-y-6">
//               <div className="flex items-center justify-between">
//                 <h2 className="text-2xl font-bold text-gray-900">
//                   {filteredTreks.length} Trek{filteredTreks.length !== 1 ? 's' : ''} Found
//                 </h2>
//                 {searchTerm && (
//                   <button
//                     onClick={() => setSearchTerm('')}
//                     className="text-sm text-indigo-600 hover:text-indigo-700"
//                   >
//                     Clear search
//                   </button>
//                 )}
//               </div>

//               {filteredTreks.length === 0 ? (
//                 <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
//                   <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
//                   <h3 className="text-xl font-medium text-gray-900 mb-2">No treks found</h3>
//                   <p className="text-gray-600 max-w-md mx-auto">
//                     Try adjusting your search terms or filters to find the perfect trek for you.
//                   </p>
//                 </div>
//               ) : (
//                 <div className={`grid gap-6 ${viewMode === 'grid'
//                   ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
//                   : 'grid-cols-1'
//                   }`}>
//                   {filteredTreks.map((trek) => (
//                     <div
//                       key={trek.id}
//                       className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-100 ${viewMode === 'list' ? 'flex' : ''
//                         }`}
//                       onClick={() => handleTrekSelect(trek)}
//                     >
//                       <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
//                         <div className="p-6">
//                           {/* Title and Location */}
//                           <div className="flex items-start justify-between mb-4">
//                             <div className="flex-1">
//                               <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
//                                 {trek?.name}
//                               </h3>
//                               {trek?.location && (
//                                 <div className="flex items-center space-x-2 text-gray-600 mb-2">
//                                   <MapPin className="w-4 h-4" />
//                                   <span className="text-sm">{trek.location}</span>
//                                 </div>
//                               )}
//                             </div>

//                             {/* Difficulty Badge */}
//                             {trek?.difficulty && (
//                               <span
//                                 className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(
//                                   trek.difficulty
//                                 )}`}
//                               >
//                                 {trek.difficulty}
//                               </span>
//                             )}
//                           </div>

//                           {/* Info Grid */}
//                           <div className="grid grid-cols-2 gap-4 mb-4">
//                             {trek?.height_ft && (
//                               <div className="flex items-center space-x-2">
//                                 <Mountain className="w-4 h-4 text-gray-500" />
//                                 <span className="text-sm text-gray-700">{trek.height_ft} ft</span>
//                               </div>
//                             )}
// {/* 
//                             {trek && 'duration' in trek && trek.duration && (
//                               <div className="flex items-center space-x-2">
//                                 <Clock className="w-4 h-4 text-gray-500" />
//                                 <span className="text-sm text-gray-700">
//                                   {typeof trek.duration === 'string' || typeof trek.duration === 'number'
//                                     ? trek.duration
//                                     : ''}
//                                 </span>
//                               </div>
//                             )} */}

//                             {/* {trek?.rating && (
// //                               <div className="flex items-center space-x-2">
// //                                 <Star className="w-4 h-4 text-amber-400 fill-current" />
// // <span className="text-sm text-gray-700">{trek?.rating !== undefined ? trek.rating : 'N/A'}</span>
// //                               </div>
//                             )} */}

//                             {Array.isArray(trek?.activities) && trek.activities.length > 0 && (
//                               <div className="flex items-center space-x-2">
//                                 <Camera className="w-4 h-4 text-gray-500" />
//                                 <span className="text-sm text-gray-700">{trek.activities.length} activities</span>
//                               </div>
//                             )}
//                           </div>

//                           {/* Highlights */}
//                           {Array.isArray(trek?.highlights) && trek.highlights.length > 0 && (
//                             <div className="pt-4 border-t border-gray-200">
//                               <div className="flex flex-wrap gap-2">
//                                 {trek.highlights.slice(0, 3).map((highlight, index) => (
//                                   <span
//                                     key={index}
//                                     className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full"
//                                   >
//                                     {highlight}
//                                   </span>
//                                 ))}
//                                 {trek.highlights.length > 3 && (
//                                   <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
//                                     +{trek.highlights.length - 3} more
//                                   </span>
//                                 )}
//                               </div>
//                             </div>
//                           )}
//                         </div>
//                       </div>

//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         {/* Loading Overlay */}
//         {isLoading && (
//           <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//             <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
//               <p className="mt-2 text-gray-700 text-center">Loading trek details...</p>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default TrekHistory;