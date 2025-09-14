'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { EyeIcon, MagnifyingGlassIcon, FunnelIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useVideoCache } from '@/hooks/useVideoCache';

interface Exercise {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  duration: number;
  reps: number;
  sets: number;
  frequency: string;
  imageUrl: string | null;
  videoUrl: string | null;
  instructions: string;
  source: string | null;
  sourceId: string | null;
  metadata: any;
  createdAt: string;
}

export default function ExerciseDirectoryPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [syncing, setSyncing] = useState(false);
  
  const { getCachedUrl, isBroken, shouldUseYouTube, preloadVideos } = useVideoCache();

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    filterExercises();
  }, [exercises, searchTerm, selectedCategory, selectedDifficulty]);

  // Preload videos when exercises are loaded
  useEffect(() => {
    if (exercises.length > 0) {
      const videoUrls = exercises
        .filter(ex => ex.imageUrl && (ex.imageUrl.includes('.mp4') || ex.imageUrl.includes('video')))
        .map(ex => ex.imageUrl!)
        .slice(0, 200); // Increased to 200 videos for better coverage
      
      if (videoUrls.length > 0) {
        console.log(`🚀 Preloading ${videoUrls.length} video URLs...`);
        preloadVideos(videoUrls);
      }
    }
  }, [exercises, preloadVideos]);

  const fetchExercises = async () => {
    try {
      console.log('🔍 Fetching exercises...');
      const response = await fetch('/api/center/exercises');
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Exercises data:', data);
        setExercises(data.exercises);
      } else {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
      }
    } catch (error) {
      console.error('❌ Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterExercises = () => {
    let filtered = exercises;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(exercise => exercise.category === selectedCategory);
    }

    // Filter by difficulty
    if (selectedDifficulty) {
      filtered = filtered.filter(exercise => exercise.difficulty === selectedDifficulty);
    }

    setFilteredExercises(filtered);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER':
        return 'bg-green-100 text-green-800';
      case 'INTERMEDIATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'ADVANCED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategories = () => {
    const categories = Array.from(new Set(exercises.map(exercise => exercise.category)));
    return categories.sort();
  };

  const getSources = () => {
    const sources = Array.from(new Set(exercises.map(exercise => exercise.source || 'manual')));
    return sources.sort();
  };

  const syncExercises = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/external/exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Successfully synced ${data.totalExercises} exercises!`);
        // Refresh the exercises list
        await fetchExercises();
      } else {
        const errorData = await response.json();
        toast.error(`Failed to sync exercises: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error syncing exercises:', error);
      toast.error('Failed to sync exercises');
    } finally {
      setSyncing(false);
    }
  };

  const showExerciseDetails = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };

  return (
    <DashboardLayout userType="center">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Exercise Directory</h1>
              <p className="text-gray-600 mt-2">
                Browse and reference exercises for creating patient exercise plans.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={syncExercises}
                disabled={syncing}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Exercises'}
              </button>
              <Link
                href="/dashboard/center/exercise-plans"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Exercise Plan
              </Link>
            </div>
          </div>
        </div>

        {/* Filters Section - Moved to Top */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search exercises..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Filter by category"
                >
                  <option value="">All Categories</option>
                  {getCategories().map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Filter by difficulty"
                >
                  <option value="">All Levels</option>
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setSelectedDifficulty('');
                  }}
                  className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Exercise Grid */}
        <div>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Showing {filteredExercises.length} of {exercises.length} exercises
                  </p>
                </div>

                {filteredExercises.length === 0 ? (
                  <div className="text-center py-12">
                    <FunnelIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No exercises found</h3>
                    <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredExercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 overflow-hidden"
                      >
                        <div className="aspect-video bg-gray-100">
                          {exercise.imageUrl ? (
                            <>
                              {exercise.imageUrl.includes('.mp4') || exercise.imageUrl.includes('video') ? (
                                <video
                                  src={exercise.imageUrl.startsWith('http') ? `/api/proxy/video?url=${encodeURIComponent(exercise.imageUrl)}` : exercise.imageUrl}
                                  className="w-full h-full object-cover"
                                  muted
                                  loop
                                  playsInline
                                  preload="metadata"
                                  crossOrigin="anonymous"
                                  onError={(e) => {
                                    console.log('Video failed to load, trying fallback...');
                                    // Try YouTube URL as fallback
                                    if (exercise.videoUrl && exercise.videoUrl.includes('youtube')) {
                                      e.currentTarget.style.display = 'none';
                                      const youtubeElement = e.currentTarget.nextElementSibling as HTMLElement;
                                      if (youtubeElement) {
                                        youtubeElement.style.display = 'flex';
                                      }
                                    } else {
                                      // Fallback to placeholder if no YouTube URL
                                      e.currentTarget.style.display = 'none';
                                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                      if (nextElement) {
                                        nextElement.style.display = 'flex';
                                      }
                                    }
                                  }}
                                />
                              ) : (
                                <img
                                  src={exercise.imageUrl.startsWith('http') ? `/api/proxy/video?url=${encodeURIComponent(exercise.imageUrl)}` : exercise.imageUrl}
                                  alt={exercise.name}
                                  className="w-full h-full object-cover"
                                  crossOrigin="anonymous"
                                  onError={(e) => {
                                    console.log('Image failed to load, showing placeholder...');
                                    // Fallback to placeholder if image fails to load
                                    e.currentTarget.style.display = 'none';
                                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (nextElement) {
                                      nextElement.style.display = 'flex';
                                    }
                                  }}
                                />
                              )}
                              {/* YouTube fallback */}
                              {exercise.videoUrl && exercise.videoUrl.includes('youtube') && (
                                <div 
                                  className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-sm"
                                  style={{ display: 'none' }}
                                >
                                  <div className="text-center">
                                    <div className="text-2xl mb-2">🎥</div>
                                    <div>YouTube Demo Available</div>
                                    <div className="text-xs mt-1">Click for details</div>
                                  </div>
                                </div>
                              )}
                              {/* Fallback placeholder */}
                              <div 
                                className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-sm"
                                style={{ display: 'none' }}
                              >
                                <div className="text-center">
                                  <div className="text-2xl mb-2">🏃‍♂️</div>
                                  <div>Exercise Demo</div>
                                  <div className="text-xs mt-1">Video not available</div>
                                </div>
                              </div>
                            </>
                          ) : (
                            /* Default placeholder when no media */
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-sm">
                              <div className="text-center">
                                <div className="text-2xl mb-2">🏃‍♂️</div>
                                <div>Exercise Demo</div>
                                <div className="text-xs mt-1">No media available</div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                              {exercise.name}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(exercise.difficulty)}`}>
                              {exercise.difficulty}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {exercise.description}
                          </p>
                          
                          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                            <span>{exercise.category}</span>
                            <span>{exercise.duration} min</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                            <span>Source: {exercise.source || 'manual'}</span>
                            <span>{new Date(exercise.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              {exercise.sets} sets × {exercise.reps} reps
                            </div>
                            <button
                              onClick={() => showExerciseDetails(exercise)}
                              className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
        </div>

        {/* Exercise Details Modal */}
        {selectedExercise && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{selectedExercise.name}</h3>
                <button
                  onClick={() => setSelectedExercise(null)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close exercise details"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getDifficultyColor(selectedExercise.difficulty)}`}>
                    {selectedExercise.difficulty}
                  </span>
                  <span className="text-sm text-gray-600">{selectedExercise.category}</span>
                  <span className="text-sm text-gray-600">{selectedExercise.duration} minutes</span>
                  <span className="text-sm text-gray-500">Source: {selectedExercise.source || 'manual'}</span>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{selectedExercise.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">Sets:</span>
                    <span className="ml-1 text-gray-600">{selectedExercise.sets}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Reps:</span>
                    <span className="ml-1 text-gray-600">{selectedExercise.reps}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Frequency:</span>
                    <span className="ml-1 text-gray-600">{selectedExercise.frequency}</span>
                  </div>
                </div>
                
                {selectedExercise.instructions && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Instructions</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{selectedExercise.instructions}</p>
                  </div>
                )}
                
                {selectedExercise.metadata && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Additional Information</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      {selectedExercise.metadata.primaryMuscles && (
                        <div>
                          <span className="font-medium">Primary Muscles:</span> {selectedExercise.metadata.primaryMuscles}
                        </div>
                      )}
                      {selectedExercise.metadata.secondaryMuscles && (
                        <div>
                          <span className="font-medium">Secondary Muscles:</span> {selectedExercise.metadata.secondaryMuscles}
                        </div>
                      )}
                      {selectedExercise.metadata.equipment && (
                        <div>
                          <span className="font-medium">Equipment:</span> {selectedExercise.metadata.equipment}
                        </div>
                      )}
                      {selectedExercise.metadata.target && (
                        <div>
                          <span className="font-medium">Target:</span> {selectedExercise.metadata.target}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(selectedExercise.videoUrl || (selectedExercise.imageUrl && (selectedExercise.imageUrl.includes('.mp4') || selectedExercise.imageUrl.includes('video')))) && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Video Demo</h4>
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      {selectedExercise.videoUrl && selectedExercise.videoUrl.includes('youtube') ? (
                        /* YouTube embed */
                        <iframe
                          src={selectedExercise.videoUrl}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={`${selectedExercise.name} - YouTube Video`}
                        />
                      ) : (
                        /* Regular video */
                        <video
                          src={selectedExercise.videoUrl ? 
                            (selectedExercise.videoUrl.includes('youtube') ? selectedExercise.videoUrl : getCachedUrl(selectedExercise.videoUrl)) :
                            (selectedExercise.imageUrl ? getCachedUrl(selectedExercise.imageUrl) : '')
                          }
                          controls
                          className="w-full h-full"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            console.log('Modal video failed to load, showing fallback...');
                            e.currentTarget.style.display = 'none';
                            const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                            if (nextElement) {
                              nextElement.style.display = 'flex';
                            }
                          }}
                        >
                          Your browser does not support the video tag.
                        </video>
                      )}
                      {/* Fallback for failed video */}
                      <div 
                        className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500"
                        style={{ display: 'none' }}
                      >
                        <div className="text-center">
                          <div className="text-4xl mb-2">🎥</div>
                          <div>Video not available</div>
                          <div className="text-sm mt-1">The video file may have been moved or removed</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
