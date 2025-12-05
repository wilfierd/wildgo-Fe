import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Check, Copy, ExternalLink, Timer } from 'lucide-react';
import {
    GitHubDeviceStartResponse,
    pollGitHubDeviceFlow,
    GitHubDevicePollResponse
} from '@/lib/api/auth';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface GitHubDeviceFlowProps {
    data: GitHubDeviceStartResponse;
    onCancel: () => void;
}

export default function GitHubDeviceFlow({ data, onCancel }: GitHubDeviceFlowProps) {
    const [copied, setCopied] = useState(false);
    const [timeLeft, setTimeLeft] = useState(data.expires_in);
    const [pollStatus, setPollStatus] = useState<'pending' | 'success' | 'expired' | 'error'>('pending');
    const [errorMessage, setErrorMessage] = useState('');

    const { login } = useAuth();
    const router = useRouter();

    // Use refs to keep track of polling to avoid closure stale issues
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Countdown timer
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    setPollStatus('expired');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // Polling logic
    useEffect(() => {
        const poll = async () => {
            if (pollStatus !== 'pending') return;

            try {
                const result = await pollGitHubDeviceFlow(data.device_code);

                if (result.status === 'authorized' && result.token && result.user) {
                    setPollStatus('success');
                    // Login and redirect
                    login(result.token, result.user);
                    router.push('/chat');
                } else if (result.status === 'expired') {
                    setPollStatus('expired');
                } else if (result.status === 'error') {
                    setPollStatus('error');
                    setErrorMessage(result.message || 'An error occurred during authentication');
                }
                // If pending, do nothing and wait for next poll
            } catch (error) {
                console.error('Polling error:', error);
                // Don't stop polling on transient network errors unless explicitly failed
            }
        };

        // Calculate poll interval in ms (add little buffer)
        const pollInterval = (data.interval || 5) * 1000;

        pollTimerRef.current = setInterval(poll, pollInterval);

        return () => {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        };
    }, [data.device_code, data.interval, pollStatus, login, router]);

    const copyCode = () => {
        navigator.clipboard.writeText(data.user_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Card className="w-full max-w-md mx-auto shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <ExternalLink className="w-5 h-5" />
                    GitHub Authorization
                </CardTitle>
                <CardDescription>
                    Complete the proces logic by entering the code below on GitHub
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {pollStatus === 'pending' && (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-500">Device Code</label>
                            <div className="flex gap-2">
                                <Input
                                    readOnly
                                    value={data.user_code}
                                    className="text-center text-lg font-mono font-bold tracking-widest bg-gray-50"
                                    onClick={(e) => (e.target as HTMLInputElement).select()}
                                />
                                <Button variant="outline" size="icon" onClick={copyCode}>
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg flex flex-col gap-3">
                            <div className="flex justify-between items-center text-sm text-blue-700">
                                <span className="font-medium">Verification URL:</span>
                                <span className="flex items-center gap-1 text-gray-500">
                                    <Timer className="w-3 h-3" /> {formatTime(timeLeft)}
                                </span>
                            </div>
                            <a
                                href={data.verification_uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline hover:text-blue-800 break-all font-medium text-center"
                            >
                                {data.verification_uri}
                            </a>
                            <Button
                                className="w-full mt-1"
                                onClick={() => window.open(data.verification_uri, '_blank')}
                            >
                                Open GitHub Page
                            </Button>
                        </div>

                        <p className="text-xs text-center text-gray-400">
                            Waiting for you to authorize the application...
                        </p>
                    </>
                )}

                {pollStatus === 'success' && (
                    <div className="text-center py-6 text-green-600 space-y-2">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Check className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold">Successfully Authenticated!</h3>
                        <p className="text-sm text-gray-500">Redirecting to chat...</p>
                    </div>
                )}

                {pollStatus === 'expired' && (
                    <div className="text-center py-6 text-red-600 space-y-2">
                        <h3 className="font-bold">Code Expired</h3>
                        <p className="text-sm text-gray-500">The verification code has expired.</p>
                        <Button variant="outline" onClick={onCancel}>Try Again</Button>
                    </div>
                )}

                {pollStatus === 'error' && (
                    <div className="text-center py-6 text-red-600 space-y-2">
                        <h3 className="font-bold">Authentication Failed</h3>
                        <p className="text-sm text-gray-500">{errorMessage}</p>
                        <Button variant="outline" onClick={onCancel}>Try Again</Button>
                    </div>
                )}
            </CardContent>

            {pollStatus === 'pending' && (
                <CardFooter>
                    <Button variant="ghost" className="w-full" onClick={onCancel}>
                        Cancel
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
