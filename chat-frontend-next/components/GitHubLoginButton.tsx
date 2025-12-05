import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';
import { startGitHubDeviceFlow, GitHubDeviceStartResponse } from '@/lib/api/auth';

interface GitHubLoginButtonProps {
    onStart: (data: GitHubDeviceStartResponse) => void;
    onError?: (error: string) => void;
}

export default function GitHubLoginButton({ onStart, onError }: GitHubLoginButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setLoading(true);
        try {
            const data = await startGitHubDeviceFlow();
            onStart(data);
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || error.message || 'Failed to start GitHub login';
            if (onError) {
                onError(errorMessage);
            } else {
                console.error('GitHub login error:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            onClick={handleClick}
            disabled={loading}
            className="w-full"
            type="button"
        >
            <Github className="mr-2 h-4 w-4" />
            {loading ? 'Connecting...' : 'Login with GitHub'}
        </Button>
    );
}
