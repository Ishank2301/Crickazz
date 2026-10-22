import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, Volume2, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

interface VoiceSearchTranscribeProps {
  onTranscribeComplete?: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export function VoiceSearchTranscribe({
  onTranscribeComplete,
  placeholder = 'Speak or record a cricket question / commentary...',
  className = '',
}: VoiceSearchTranscribeProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    setErrorMessage(null);
    setTranscribedText('');
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser context.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach((track) => track.stop());
        await sendAudioToTranscribe(audioBlob, mimeType);
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone permission or hardware error:', err);
      setErrorMessage(
        err.message || 'Microphone access denied or unavailable. You can use the presets below.'
      );
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const sendAudioToTranscribe = async (blob: Blob, mimeType: string) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1] || result;
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      const base64Audio = await base64Promise;

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64Audio, mimeType }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to transcribe audio');
      }

      const text = data.transcription || 'No audible speech detected';
      setTranscribedText(text);
      if (onTranscribeComplete) {
        onTranscribeComplete(text);
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      setErrorMessage(err.message || 'Transcription failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      sendAudioToTranscribe(file, file.type || 'audio/webm');
    }
  };

  const runSamplePreset = (presetText: string) => {
    setTranscribedText(presetText);
    if (onTranscribeComplete) {
      onTranscribeComplete(presetText);
    }
  };

  return (
    <div className={`bg-[#111827] border border-slate-800 rounded-lg p-3.5 ${className}`}>
      <div className="flex items-center justify-between gap-4 mb-2.5">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Volume2 className="w-4 h-4 text-emerald-500" />
          <span className="text-slate-200 font-semibold">Voice Commentary & Query Input</span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span className="text-[11px] font-mono text-slate-400">gemini-3.5-transcribe</span>
        </div>

        {isRecording && (
          <div className="flex items-center gap-2 text-rose-400 text-xs font-mono tabular-nums">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Recording {recordingSeconds}s</span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Record Button */}
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`px-3.5 py-1.5 rounded-md font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            isRecording
              ? 'bg-rose-600 hover:bg-rose-500 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Transcribing...</span>
            </>
          ) : isRecording ? (
            <>
              <MicOff className="w-3.5 h-3.5" />
              <span>Stop Recording</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5" />
              <span>Speak Query</span>
            </>
          )}
        </button>

        {/* File Upload Option */}
        <label className="cursor-pointer px-3 py-1.5 rounded-md border border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs flex items-center justify-center gap-1.5 transition-colors">
          <Upload className="w-3.5 h-3.5 text-slate-400" />
          <span>Upload Audio</span>
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isProcessing || isRecording}
          />
        </label>

        {/* Quick Voice Prompt Presets */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto text-xs py-0.5">
          <span className="text-slate-500 text-[11px] whitespace-nowrap">Examples:</span>
          <button
            type="button"
            onClick={() => runSamplePreset('List top 10 highest run scorers in ODI cricket with average and centuries')}
            className="whitespace-nowrap px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] border border-slate-800 transition-colors"
          >
            "Top ODI run scorers"
          </button>
          <button
            type="button"
            onClick={() => runSamplePreset('Find all players who represent India with their batting style')}
            className="whitespace-nowrap px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] border border-slate-800 transition-colors"
          >
            "India squad info"
          </button>
          <button
            type="button"
            onClick={() => runSamplePreset('Calculate how many matches each team has won')}
            className="whitespace-nowrap px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] border border-slate-800 transition-colors"
          >
            "Total team wins"
          </button>
        </div>
      </div>

      {/* Transcribed Text Output Display */}
      {transcribedText && (
        <div className="mt-2.5 p-2.5 rounded-md bg-[#0f172a] border border-slate-800 text-slate-200 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-slate-400 font-medium mr-2">Transcribed:</span>
            <span className="text-slate-100 font-mono text-[11px]">"{transcribedText}"</span>
          </div>
          {onTranscribeComplete && (
            <button
              type="button"
              onClick={() => onTranscribeComplete(transcribedText)}
              className="text-[11px] px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
            >
              Use Query
            </button>
          )}
        </div>
      )}

      {/* Error Message Display */}
      {errorMessage && (
        <div className="mt-2.5 p-2.5 rounded-md bg-rose-950/30 border border-rose-900/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
