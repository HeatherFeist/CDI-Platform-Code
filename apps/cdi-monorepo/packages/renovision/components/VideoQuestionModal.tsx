import React, { useState, useRef, useEffect, useCallback } from 'react';
import Spinner from './Spinner';
import { VideoQuestion } from '../types/videoQuestion';

const VideoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

interface VideoQuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (videoQuestion: Omit<VideoQuestion, 'id' | 'timestamp' | 'status'>) => Promise<void>;
    projectId?: string;
}

const VideoQuestionModal: React.FC<VideoQuestionModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    projectId
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [question, setQuestion] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            setError(null);
            setIsLoading(true);
            setRecordedBlob(null);
            setQuestion('');

            const startCamera = async () => {
                try {
                    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                        throw new Error("Camera API is not supported in this browser.");
                    }
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'environment' },
                        audio: true
                    });
                    
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.onloadedmetadata = () => {
                            setIsLoading(false);
                        };
                        streamRef.current = stream;
                        
                        // Initialize MediaRecorder
                        mediaRecorderRef.current = new MediaRecorder(stream);
                        mediaRecorderRef.current.ondataavailable = (event) => {
                            if (event.data.size > 0) {
                                chunksRef.current.push(event.data);
                            }
                        };
                        mediaRecorderRef.current.onstop = () => {
                            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                            setRecordedBlob(blob);
                            chunksRef.current = [];
                        };
                    }
                } catch (err) {
                    console.error("Camera error:", err);
                    if (err instanceof Error) {
                        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                            setError("Camera and microphone permissions were denied. Please allow access in your browser settings.");
                        } else {
                            setError("Could not access the camera and microphone. They may be in use by another application.");
                        }
                    } else {
                        setError("An unknown error occurred while accessing the camera.");
                    }
                    setIsLoading(false);
                }
            };
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isOpen, stopCamera]);

    const handleStartRecording = () => {
        if (mediaRecorderRef.current && !isRecording) {
            chunksRef.current = [];
            mediaRecorderRef.current.start();
            setIsRecording(true);
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleSubmit = async () => {
        if (recordedBlob && question) {
            setIsSubmitting(true);
            try {
                // Upload video to storage and get URL
                // This is a placeholder - implement your actual upload logic
                const videoUrl = URL.createObjectURL(recordedBlob); // Temporary URL for demo

                await onSubmit({
                    videoUrl,
                    question,
                    projectId
                });
                
                onClose();
            } catch (error) {
                console.error('Error submitting video question:', error);
                setError('Failed to submit your question. Please try again.');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleModalContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl p-4 md:p-6 relative transform transition-all flex flex-col text-white"
                style={{ height: '90vh', maxHeight: '700px' }}
                onClick={handleModalContentClick}
                role="document"
            >
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-20"
                    aria-label="Close camera"
                >
                    <CloseIcon />
                </button>
                
                <div className="text-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl font-extrabold">Record Your Question</h2>
                </div>

                <div className="w-full h-full bg-black rounded-lg relative overflow-hidden flex-grow flex items-center justify-center">
                    {(isLoading && !error) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                            <Spinner />
                            <p className="mt-4 text-zinc-400">Starting camera...</p>
                        </div>
                    )}
                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black p-4">
                            <p className="text-red-400 text-center">{error}</p>
                        </div>
                    )}
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline
                        muted={!isRecording}
                        className={`w-full h-full object-contain transition-opacity duration-300 ${isLoading || error ? 'opacity-0' : 'opacity-100'}`}
                    />
                    
                    {isRecording && (
                        <div className="absolute top-4 left-4">
                            <div className="flex items-center space-x-2 bg-red-500/80 px-3 py-1 rounded-full">
                                <div className="w-3 h-3 rounded-full bg-red-100 animate-pulse"></div>
                                <span>Recording</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-4 space-y-4">
                    <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Type your question here..."
                        className="w-full px-4 py-2 rounded bg-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        disabled={isRecording || isSubmitting}
                    />

                    <div className="flex justify-center space-x-4">
                        {!recordedBlob ? (
                            <button
                                onClick={isRecording ? handleStopRecording : handleStartRecording}
                                disabled={isLoading || !!error || isSubmitting}
                                className={`px-6 py-3 rounded-full font-semibold transition-all
                                    ${isRecording
                                        ? 'bg-red-500 hover:bg-red-600 text-white'
                                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isRecording ? 'Stop Recording' : 'Start Recording'}
                            </button>
                        ) : (
                            <div className="flex space-x-4">
                                <button
                                    onClick={() => setRecordedBlob(null)}
                                    disabled={isSubmitting}
                                    className="px-6 py-3 rounded-full font-semibold bg-zinc-600 hover:bg-zinc-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Record Again
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!question || isSubmitting}
                                    className="px-6 py-3 rounded-full font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Question'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoQuestionModal;