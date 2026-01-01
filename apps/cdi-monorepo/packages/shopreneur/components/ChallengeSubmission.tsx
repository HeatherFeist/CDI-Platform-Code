import React, { useState, useRef } from 'react';
import { Challenge, ChallengeSubmission as ChallengeSubmissionType, UserProfile } from '../types';
import { Upload, Image, Video, Send, X, Instagram, Facebook, Youtube, Link as LinkIcon, Check } from 'lucide-react';

interface ChallengeSubmissionProps {
  challenge: Challenge;
  currentUser: UserProfile;
  onSubmit: (submission: Partial<ChallengeSubmissionType>) => Promise<void>;
  onClose: () => void;
}

const ChallengeSubmission: React.FC<ChallengeSubmissionProps> = ({
  challenge,
  currentUser,
  onSubmit,
  onClose
}) => {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [platform, setPlatform] = useState<'facebook' | 'instagram' | 'tiktok' | 'youtube'>('instagram');
  const [platformPostUrl, setPlatformPostUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<'select' | 'details' | 'confirm'>('select');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    if (challenge.type === 'video' && !isVideo) {
      alert('Please select a video file for this challenge');
      return;
    }
    if (challenge.type === 'post' && !isImage) {
      alert('Please select an image file for this challenge');
      return;
    }

    setMediaFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
      setUploadStep('details');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!mediaFile || !caption) {
      alert('Please add media and a caption');
      return;
    }

    setIsUploading(true);
    
    try {
      // Create submission object
      const submission: Partial<ChallengeSubmissionType> = {
        challengeId: challenge.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatarUrl,
        mediaUrl: mediaPreview, // In production, upload to cloud storage first
        mediaType: challenge.type === 'video' ? 'video' : 'image',
        caption: caption,
        platform: platform,
        platformPostUrl: platformPostUrl || undefined,
        submittedAt: new Date().toISOString(),
        voteCount: 0
      };

      await onSubmit(submission);
      setUploadStep('confirm');
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getPlatformIcon = (platformName: string) => {
    switch (platformName) {
      case 'instagram': return <Instagram className="w-5 h-5" />;
      case 'facebook': return <Facebook className="w-5 h-5" />;
      case 'youtube': return <Youtube className="w-5 h-5" />;
      default: return <LinkIcon className="w-5 h-5" />;
    }
  };

  const getPlatformColor = (platformName: string) => {
    switch (platformName) {
      case 'instagram': return 'from-purple-600 to-pink-600';
      case 'facebook': return 'from-blue-600 to-blue-700';
      case 'tiktok': return 'from-black to-pink-600';
      case 'youtube': return 'from-red-600 to-red-700';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">Submit Your Entry</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-purple-100">{challenge.title}</p>
        </div>

        <div className="p-6">
          {/* Step 1: Select Media */}
          {uploadStep === 'select' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Upload Your {challenge.type === 'video' ? 'Video' : 'Image'}</h3>
                <p className="text-gray-600 mb-6">
                  {challenge.prompt}
                </p>
              </div>

              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-3 border-dashed border-purple-300 rounded-xl p-12 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
              >
                <div className="flex flex-col items-center gap-4">
                  {challenge.type === 'video' ? (
                    <Video className="w-16 h-16 text-purple-400" />
                  ) : (
                    <Image className="w-16 h-16 text-purple-400" />
                  )}
                  <div>
                    <p className="text-lg font-semibold text-gray-700 mb-1">
                      Click to upload {challenge.type === 'video' ? 'video' : 'image'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {challenge.type === 'video' ? 'MP4, MOV, AVI (max 100MB)' : 'PNG, JPG, GIF (max 10MB)'}
                    </p>
                  </div>
                  <Upload className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={challenge.type === 'video' ? 'video/*' : 'image/*'}
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Tips */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Quick Tips</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  {challenge.tips.slice(0, 3).map((tip, index) => (
                    <li key={index}>• {tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Add Details */}
          {uploadStep === 'details' && mediaPreview && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Media Preview */}
                <div>
                  <h3 className="font-semibold mb-3">Your {challenge.type === 'video' ? 'Video' : 'Image'}</h3>
                  <div className="relative rounded-lg overflow-hidden bg-gray-100">
                    {challenge.type === 'video' ? (
                      <video
                        src={mediaPreview}
                        controls
                        className="w-full h-64 object-cover"
                      />
                    ) : (
                      <img
                        src={mediaPreview}
                        alt="Preview"
                        className="w-full h-64 object-cover"
                      />
                    )}
                    <button
                      onClick={() => {
                        setMediaFile(null);
                        setMediaPreview('');
                        setUploadStep('select');
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold mb-2">Platform</label>
                    <div className="grid grid-cols-2 gap-2">
                      {challenge.requiredPlatforms.map((plt) => (
                        <button
                          key={plt}
                          onClick={() => setPlatform(plt as any)}
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                            platform === plt
                              ? 'border-purple-600 bg-purple-50 text-purple-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {getPlatformIcon(plt)}
                          <span className="font-medium capitalize">{plt}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Caption *</label>
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Write a compelling caption for your post..."
                      className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-purple-500 focus:outline-none resize-none"
                      rows={4}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {caption.length}/500 characters
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">
                      Post URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={platformPostUrl}
                      onChange={(e) => setPlatformPostUrl(e.target.value)}
                      placeholder="https://instagram.com/p/..."
                      className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-purple-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Already posted? Add the link here
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setUploadStep('select')}
                  className="flex-1 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isUploading || !caption}
                  className={`flex-1 bg-gradient-to-r ${getPlatformColor(platform)} text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 ${
                    isUploading || !caption ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Entry
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {uploadStep === 'confirm' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-green-600 mb-2">
                Submission Successful!
              </h3>
              <p className="text-gray-600 mb-6">
                Your entry has been submitted. Good luck! 🎉
              </p>
              <div className="bg-purple-50 rounded-lg p-4 max-w-md mx-auto">
                <p className="font-semibold text-purple-900">You earned:</p>
                <div className="flex items-center justify-center gap-6 mt-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">+{challenge.xpReward}</div>
                    <div className="text-xs text-purple-700">XP</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">+{challenge.coinReward}</div>
                    <div className="text-xs text-yellow-700">Coins</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChallengeSubmission;
